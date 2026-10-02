import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { createCipheriv, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { createCustomerInvoicePdf } from "../src/lib/customer-invoice-pdf.ts";
const base = process.env.INVOICE_TEST_URL || "http://localhost:3021";
if (
  !["localhost", "127.0.0.1"].includes(new URL(base).hostname) ||
  new URL(process.env.DATABASE_URL).hostname !== "127.0.0.1" ||
  new URL(process.env.DATABASE_URL).pathname !== "/invoice_workflow_test"
)
  throw new Error(
    "Invoice tests require the isolated localhost invoice_workflow_test database.",
  );
const db = new PrismaClient();
const cookies = new Map();
let checks = 0;
function check(actual, expected, label) {
  assert.deepEqual(actual, expected, label);
  checks++;
  console.log(`PASS ${label}`);
}
async function req(
  path,
  { data, method, form, anonymous = false, origin } = {},
) {
  const result = await fetch(base + path, {
    method: method || (data || form ? "POST" : "GET"),
    headers: {
      ...(!anonymous
        ? { cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join("; ") }
        : {}),
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(origin ? { origin } : {}),
    },
    body: form || (data ? JSON.stringify(data) : undefined),
    redirect: "manual",
  });
  for (const value of result.headers.getSetCookie()) {
    const cookie = value.split(";")[0];
    const index = cookie.indexOf("=");
    cookies.set(cookie.slice(0, index), cookie.slice(index + 1));
  }
  const text = await result.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: result.status, body, headers: result.headers };
}
const job = "/api/admin/projects/invoice-test-job";
const providerState = "/private/tmp/finley-invoice-provider-state.json";
function provider(change) {
  const state = JSON.parse(readFileSync(providerState, "utf8"));
  if (change) {
    Object.assign(state, change);
    writeFileSync(providerState, JSON.stringify(state));
  }
  return state;
}
function uploadForm(content = "%PDF-1.4\n% invoice test fixture") {
  const form = new FormData();
  form.append(
    "file",
    new Blob([content], { type: "application/pdf" }),
    "supplier-test.pdf",
  );
  return form;
}
try {
  function encrypt(text) {
    const iv = randomBytes(12),
      cipher = createCipheriv("aes-256-gcm", Buffer.alloc(32, 7), iv);
    return [
      iv,
      cipher.update(text, "utf8"),
      cipher.final(),
      cipher.getAuthTag(),
    ]
      .map((part) => part.toString("base64"))
      .join(".");
  }
  await db.user.upsert({
    where: { id: "invoice-test-admin" },
    update: {},
    create: {
      id: "invoice-test-admin",
      email: "invoice-test@example.test",
      firstName: "Invoice",
      lastName: "Tester",
      role: "ADMIN",
      status: "APPROVED",
      passwordHash: await bcrypt.hash("local-invoice-test", 10),
    },
  });
  await db.client.upsert({
    where: { id: "invoice-test-client" },
    update: {},
    create: { id: "invoice-test-client", companyName: "Sample Client" },
  });
  for (const id of ["invoice-test-job", "invoice-other-job"])
    await db.project.upsert({
      where: { id },
      update: { retailMultiplier: 1.6769 },
      create: {
        id,
        name:
          id === "invoice-test-job"
            ? "Panel production — workflow test"
            : "Other test job",
        createdById: "invoice-test-admin",
        clientId: "invoice-test-client",
        status: "IN_PROGRESS",
        retailMultiplier: 1.6769,
      },
    });
  const tokens = {
    realmId: "123",
    environment: "sandbox",
    accessToken: encrypt("test-access"),
    refreshToken: encrypt("test-refresh"),
    expiresAt: new Date(Date.now() + 3600000),
  };
  await db.quickBooksConnection.upsert({
    where: { id: "company" },
    update: tokens,
    create: { id: "company", ...tokens },
  });
  await db.vendorBill.deleteMany({
    where: { projectId: { in: ["invoice-test-job", "invoice-other-job"] } },
  });
  await db.supplierInvoice.deleteMany({
    where: { projectId: { in: ["invoice-test-job", "invoice-other-job"] } },
  });
  await db.invoice.deleteMany({
    where: { projectId: { in: ["invoice-test-job", "invoice-other-job"] } },
  });
  await db.quickBooksExport.deleteMany();
  writeFileSync(
    providerState,
    JSON.stringify({
      Bill: [],
      Purchase: [],
      Invoice: [],
      attachments: [],
      calls: [],
    }),
  );
  check(
    (await req(`${job}/supplier-invoices`, { anonymous: true })).status,
    401,
    "anonymous invoice listing rejected",
  );
  const csrf = await req("/api/auth/csrf");
  const form = new URLSearchParams({
    csrfToken: csrf.body.csrfToken,
    email: "invoice-test@example.test",
    password: "local-invoice-test",
    json: "true",
  });
  check(
    (await req("/api/auth/callback/credentials", { form })).status,
    200,
    "test administrator signed in",
  );
  check(
    (
      await req(`${job}/supplier-invoices`, {
        form: uploadForm(),
        origin: "https://untrusted.example",
      })
    ).status,
    403,
    "cross-origin invoice mutation rejected",
  );
  check(
    (
      await req(`${job}/supplier-invoices`, {
        form: uploadForm("<script>invalid file</script>"),
      })
    ).status,
    400,
    "disguised non-PDF rejected",
  );
  const uploaded = await req(`${job}/supplier-invoices`, {
    form: uploadForm(),
  });
  check(uploaded.status, 200, "supplier original uploaded and extracted");
  const docId = uploaded.body.documentId;
  const docPath = `${job}/supplier-invoices/${docId}`;
  check(
    (await req(`${job}/supplier-invoices`, { form: uploadForm() })).body
      .documentId,
    docId,
    "repeat upload returns the same document",
  );
  check(
    (
      await req("/api/admin/projects/invoice-other-job/supplier-invoices", {
        form: uploadForm(),
      })
    ).status,
    409,
    "same PDF cannot silently double-count across jobs",
  );
  check(
    (await req(docPath, { anonymous: true })).status,
    401,
    "supplier PDF is private",
  );
  check(
    (await req(docPath)).headers.get("content-type"),
    "application/pdf",
    "administrator can retrieve original PDF",
  );
  check(
    (
      await req(
        `/api/admin/projects/invoice-other-job/supplier-invoices/${docId}`,
      )
    ).status,
    404,
    "document lookup is scoped to job",
  );
  const doc = (await req(`${job}/supplier-invoices`)).body.documents.find(
    (item) => item.id === docId,
  );
  const details = doc.details;
  check(details.total, 115, "extracted total returned for review");
  check(
    await db.vendorBill.count({ where: { projectId: "invoice-test-job" } }),
    0,
    "upload alone creates no ledger costs",
  );
  check(
    (
      await req(docPath, {
        method: "PATCH",
        data: { action: "approve", details: { ...details, total: 116 } },
      })
    ).status,
    400,
    "unbalanced supplier lines rejected",
  );
  const approved = await Promise.all([
    req(docPath, { method: "PATCH", data: { action: "approve", details } }),
    req(docPath, { method: "PATCH", data: { action: "approve", details } }),
  ]);
  check(
    approved.map((item) => item.status),
    [200, 200],
    "concurrent approvals return success",
  );
  check(
    await db.vendorBill.count({ where: { projectId: "invoice-test-job" } }),
    2,
    "concurrent approvals add costs only once",
  );
  const bill = await db.vendorBill.findFirst({
    where: { projectId: "invoice-test-job" },
  });
  check(
    (
      await req(`${job}/bills`, {
        method: "PATCH",
        data: {
          billId: bill.id,
          category: "MATERIALS",
          costName: "Changed",
          amount: 100,
          status: "UNPAID",
          date: "2026-09-21",
        },
      })
    ).status,
    409,
    "approved source costs cannot diverge through manual editing",
  );
  const options = await req("/api/admin/quickbooks");
  check(options.status, 200, "connected QuickBooks references load");
  check(
    options.body.customers[0].id,
    "1",
    "customer/job options are available",
  );
  provider({ failAfterAccept: "Bill" });
  const mapping = {
    customerId: "1",
    vendorId: "2",
    expenseAccountId: "3",
    paymentAccountId: "4",
  };
  check(
    (await req(`${docPath}/quickbooks`, { data: mapping })).status,
    502,
    "lost QuickBooks response preserves retry state",
  );
  check(
    (await req(`${docPath}/quickbooks`, { data: mapping })).status,
    200,
    "retry recovers accepted bill and attaches PDF",
  );
  check(
    provider().Bill.length,
    1,
    "timeout retry creates only one supplier bill",
  );
  check(
    provider().attachments[0].AttachableRef[0].IncludeOnSend,
    false,
    "supplier original is never customer-facing",
  );
  check(
    provider().Bill[0].Line.every(
      (line) =>
        line.AccountBasedExpenseLineDetail.BillableStatus === "NotBillable",
    ),
    true,
    "separate selling-price invoicing avoids double billing expenses",
  );
  let preview = (await req(`${job}/quickbooks-invoice`)).body;
  check(
    preview.subtotal,
    182.69,
    "customer preview applies markup and keeps freight at cost",
  );
  const draft = {
    date: "2026-09-21",
    dueDate: "2026-10-21",
    customerId: "1",
    itemId: "5",
    pricingVersion: preview.pricingVersion,
    lines: preview.lines.map((line) => ({
      id: line.id,
      description: line.description,
      taxable: false,
    })),
  };
  check(
    (
      await req(`${job}/quickbooks-invoice`, {
        data: { action: "draft", draft: { ...draft, pricingVersion: "stale" } },
      })
    ).status,
    409,
    "stale pricing snapshot rejected",
  );
  check(
    (
      await req(`${job}/quickbooks-invoice`, {
        data: { action: "draft", draft },
      })
    ).status,
    200,
    "customer draft persists",
  );
  check(
    provider().Invoice.length,
    0,
    "saving draft does not create a QuickBooks invoice",
  );
  provider({ failAfterAccept: "Invoice" });
  check(
    (
      await req(`${job}/quickbooks-invoice`, {
        data: { action: "create", draft },
      })
    ).status,
    502,
    "lost customer invoice response is recoverable",
  );
  await db.project.update({
    where: { id: "invoice-test-job" },
    data: { retailMultiplier: 2 },
  });
  check(
    (await req(`${job}/quickbooks-invoice`)).body.subtotal,
    182.69,
    "pending preview shows frozen submission after job pricing changes",
  );
  check(
    (
      await req(`${job}/quickbooks-invoice`, {
        data: { action: "draft", draft },
      })
    ).status,
    409,
    "pending submission cannot be overwritten by another draft",
  );
  check(
    (
      await req(`${job}/quickbooks-invoice`, {
        data: { action: "create", draft },
      })
    ).status,
    200,
    "customer invoice retry recovers existing record",
  );
  check(
    (
      await req(`${job}/quickbooks-invoice`, {
        data: { action: "create", draft },
      })
    ).body.existing,
    true,
    "repeat create opens existing invoice",
  );
  check(provider().Invoice.length, 1, "only one customer invoice created");
  check(
    provider().Invoice[0].TotalAmt,
    182.69,
    "QuickBooks receives approved selling prices",
  );
  check(
    provider().Invoice[0].EmailStatus,
    "NotSet",
    "invoice is saved for review without requesting email delivery",
  );
  const state = provider();
  state.Invoice[0].Balance = 0;
  provider(state);
  check(
    (await req(`${job}/quickbooks-invoice?refresh=1`)).body.invoice.status,
    "PAID",
    "QuickBooks payment status returns to tracker",
  );
  const paidUpload = await req(`${job}/supplier-invoices`, {
    form: uploadForm("%PDF-1.4\n% paid fixture"),
  });
  const paidPath = `${job}/supplier-invoices/${paidUpload.body.documentId}`;
  const paidDetails = {
    ...details,
    invoiceNumber: "PAID-102",
    paymentStatus: "PAID",
  };
  check(
    (
      await req(paidPath, {
        method: "PATCH",
        data: {
          action: "approve",
          details: { ...paidDetails, currency: "CAD" },
        },
      })
    ).status,
    400,
    "foreign-currency supplier costs cannot enter the USD ledger",
  );
  check(
    (
      await req(paidPath, {
        method: "PATCH",
        data: { action: "approve", details: paidDetails },
      })
    ).status,
    200,
    "already-paid supplier invoice can be approved",
  );
  check(
    (
      await req(`${paidPath}/quickbooks`, {
        data: { ...mapping, paymentAccountId: "3" },
      })
    ).status,
    400,
    "paid expense requires a bank or credit-card account",
  );
  provider({ failAttachment: true });
  check(
    (await req(`${paidPath}/quickbooks`, { data: mapping })).status,
    502,
    "attachment failure preserves the accepted expense",
  );
  check(
    (await req(`${paidPath}/quickbooks`, { data: mapping })).status,
    200,
    "retry attaches the PDF to the existing expense",
  );
  check(
    provider().Purchase.length,
    1,
    "attachment retry creates no second expense",
  );
  check(
    provider().Purchase[0].AccountRef.value,
    "4",
    "already-paid expense uses the selected payment account",
  );
  const matchUpload = await req(`${job}/supplier-invoices`, {
    form: uploadForm("%PDF-1.4\n% matching fixture"),
  });
  const matchPath = `${job}/supplier-invoices/${matchUpload.body.documentId}`;
  await req(matchPath, {
    method: "PATCH",
    data: {
      action: "approve",
      details: { ...details, invoiceNumber: "EXIST-103" },
    },
  });
  const matching = provider();
  matching.Bill.push({
    ...matching.Bill[0],
    Id: "301",
    DocNumber: "EXIST-103",
    PrivateNote: "Created manually",
  });
  provider(matching);
  check(
    (await req(`${matchPath}/quickbooks`, { data: mapping })).status,
    200,
    "matching existing QuickBooks bill is linked and attached",
  );
  check(
    provider().Bill.length,
    2,
    "matching an existing bill does not create a duplicate",
  );
  provider({ failExtraction: true });
  const fallbackPdf = createCustomerInvoicePdf({
    projectId: "fallback-fixture",
    projectName: "Panel production",
    customerName: "Sample Client",
    invoiceDate: new Date("2026-09-21"),
    dueDate: new Date("2026-10-21"),
    lineItems: [{ description: "Panels", amount: 115 }],
  });
  const fallback = await req(`${job}/supplier-invoices`, {
    form: uploadForm(new Uint8Array(await fallbackPdf.arrayBuffer())),
  });
  check(fallback.status, 200, "provider failure keeps the uploaded original");
  const fallbackDoc = (
    await req(`${job}/supplier-invoices`)
  ).body.documents.find((item) => item.id === fallback.body.documentId);
  check(
    fallbackDoc.warning.startsWith("Basic PDF reading"),
    true,
    "local PDF text extraction works when AI is unavailable",
  );
  await db.quickBooksConnection.update({
    where: { id: "company" },
    data: { expiresAt: new Date(0) },
  });
  check(
    (await req("/api/admin/quickbooks")).status,
    200,
    "expired QuickBooks access token is refreshed",
  );
  await db.quickBooksConnection.delete({ where: { id: "company" } });
  check(
    (await req("/api/admin/quickbooks")).body.connected,
    false,
    "disconnected account status is explicit",
  );
  await db.quickBooksConnection.create({ data: { id: "company", ...tokens } });
  console.log(`${checks} invoice integration assertions passed.`);
} finally {
  await db.$disconnect();
}
