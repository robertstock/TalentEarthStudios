import assert from "node:assert/strict";
import test from "node:test";
import {
  extractInvoiceText,
  extractSupplierInvoice,
} from "./supplier-extraction.ts";
import {
  emptySupplierDetails,
  fillSupplierDetails,
} from "./invoice-workflow.ts";
import { createCustomerInvoicePdf } from "./customer-invoice-pdf.ts";

const invoiceText = `Page 1 of 1
Invoice #: TEST-132667
Order Created:
123 Sample St
Sample City, CA 90000
Ph: (555) 555-0100
Email: test@example.test
Web: example.test
Example Print Company
Customer #: 42
Order Date: Account No.: 42\t9/14/2026 1:20:21PM
1 Flatbed Prints 21.00 $1,690.50
Description: Drivers Plaque
1.A Misc 1.00 $0.00
Description: Aluminum Easel
2 Flatbed Prints 40.00 $3,220.00
Description: Drivers Plaque
$4,910.50\tOrder Subtotal:
$0.00\tTotal Taxes:
$4,910.50\tTotal:
Order Balance: $4,910.50`;

test("reads a printing invoice with amounts before total labels", () => {
  const details = extractInvoiceText(invoiceText);
  assert.equal(details.supplier, "Example Print Company");
  assert.equal(details.invoiceNumber, "TEST-132667");
  assert.equal(details.date, "2026-09-14");
  assert.equal(details.total, 4910.5);
  assert.deepEqual(
    details.lines.map((line) => [line.category, line.amount]),
    [
      ["OUTSIDE_PRINTING", 1690.5],
      ["OUTSIDE_PRINTING", 3220],
    ],
  );
  assert.equal(details.lines[0].description, "Flatbed Prints — Drivers Plaque");
});

test("keeps freight separate and reconciles explicitly stated supplier tax", () => {
  const details = extractInvoiceText(`Example Shop
Invoice # TEST-2
Invoice Date: 2026-09-24
Due Date: 2026-10-24
Panels $100.00
Delivery $15.00
Sales Tax: $8.00
Invoice Total: $123.00
Paid in full
Balance: $0.00`);
  assert.equal(details.total, 123);
  assert.equal(details.date, "2026-09-24");
  assert.equal(details.dueDate, "2026-10-24");
  assert.equal(details.paymentStatus, "PAID");
  assert.deepEqual(
    details.lines.map((line) => [line.category, line.amount]),
    [
      ["OTHER", 100],
      ["COURIER_FREIGHT", 15],
      ["OTHER", 8],
    ],
  );
});

test("does not substitute a deposit balance for the invoice total or guess cost allocation", () => {
  const details = extractInvoiceText(
    "Example Shop\nMaterials $80.00\nTotal: $100.00\nPayment received: $60.00\nBalance: $40.00",
  );
  assert.equal(details.total, 100);
  assert.equal(details.paymentStatus, "UNPAID");
  assert.deepEqual(details.lines, [
    { description: "", category: "OTHER", amount: 100 },
  ]);
});

test("retry fills empty fields and preserves manual review including costs", () => {
  const extracted = extractInvoiceText(invoiceText);
  assert.deepEqual(
    fillSupplierDetails(emptySupplierDetails(), extracted),
    extracted,
  );
  const current = {
    ...emptySupplierDetails(),
    supplier: "My supplier correction",
    total: 5000,
    lines: [
      {
        description: "Reviewed cost",
        category: "MATERIALS" as const,
        amount: 5000,
      },
    ],
  };
  const merged = fillSupplierDetails(current, extracted);
  assert.equal(merged.supplier, current.supplier);
  assert.equal(merged.invoiceNumber, extracted.invoiceNumber);
  assert.equal(merged.total, 5000);
  assert.deepEqual(merged.lines, current.lines);
});

test("real PDF fallback loads its worker and reads totals when the AI provider fails", async (t) => {
  const key = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "synthetic-test-key";
  t.after(() => {
    if (key === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = key;
  });
  const logs: unknown[][] = [];
  t.mock.method(console, "warn", (...args: unknown[]) => logs.push(args));
  t.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(
        JSON.stringify({
          error: {
            code: "insufficient_quota",
            message: "private-provider-message",
          },
        }),
        { status: 429 },
      ),
  );
  const pdf = createCustomerInvoicePdf({
    projectId: "synthetic",
    projectName: "Panels",
    customerName: "Example Customer",
    invoiceDate: new Date("2026-09-24"),
    dueDate: new Date("2026-10-24"),
    lineItems: [{ description: "Panels", amount: 115 }],
  });
  const result = await extractSupplierInvoice({
    fileName: "synthetic.pdf",
    mimeType: "application/pdf",
    fileData: new Uint8Array(await pdf.arrayBuffer()),
  });
  assert.match(result.warning, /^Basic PDF reading/);
  assert.equal(result.details.total, 115);
  assert.match(JSON.stringify(logs), /insufficient_quota/);
  assert.doesNotMatch(
    JSON.stringify(logs),
    /private-provider-message|synthetic-test-key/,
  );
});

test("successful provider response populates invoice details", async (t) => {
  const key = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "synthetic-test-key";
  t.after(() => {
    if (key === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = key;
  });
  const expected = extractInvoiceText(invoiceText);
  let extractedCurrency = "US$";
  t.mock.method(
    globalThis,
    "fetch",
    async (_input: unknown, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      assert.equal(body.store, false);
      assert.match(body.input[0].content[0].text, /JSON/i);
      assert.equal(body.input[0].content[1].type, "input_image");
      return Response.json({
        output: [
          {
            content: [
              {
                type: "output_text",
                text: JSON.stringify({
                  ...expected,
                  currency: extractedCurrency,
                }),
              },
            ],
          },
        ],
      });
    },
  );
  for (const currency of [
    "US$",
    "US dollars",
    "United States Dollars",
    "CAD",
  ]) {
    extractedCurrency = currency;
    const result = await extractSupplierInvoice({
      fileName: "synthetic.png",
      mimeType: "image/png",
      fileData: new Uint8Array([1]),
    });
    assert.deepEqual(result.details, {
      ...expected,
      currency: currency === "CAD" ? "CAD" : "USD",
    });
    assert.match(result.warning, /read automatically/);
  }
});

test("retry corrects a saved US-dollar symbol without replacing reviewed amounts", () => {
  const current = { ...extractInvoiceText(invoiceText), currency: "US$" };
  const merged = fillSupplierDetails(current, emptySupplierDetails());
  assert.deepEqual(merged, { ...current, currency: "USD" });
});

test("unreadable files keep blank dates and permit manual review", async (t) => {
  const key = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  t.after(() => {
    if (key !== undefined) process.env.OPENAI_API_KEY = key;
  });
  t.mock.method(console, "warn", () => {});
  const result = await extractSupplierInvoice({
    fileName: "invalid.pdf",
    mimeType: "application/pdf",
    fileData: new TextEncoder().encode("%PDF-invalid"),
  });
  assert.deepEqual(result.details, emptySupplierDetails());
  assert.match(result.warning, /Try reading it again/);
});
