import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { InvoiceError } from "@/lib/invoice-api";

type QboRecord = {
  Id: string;
  DisplayName?: string;
  FullyQualifiedName?: string;
  Name?: string;
  AccountType?: string;
  Type?: string;
  Active?: boolean;
  CurrencyRef?: { value: string };
  [key: string]: unknown;
};
type QboResponse = {
  QueryResponse?: Record<string, QboRecord[]>;
  [key: string]: unknown;
};
export const quickBooksEnvironment = () =>
  process.env.QUICKBOOKS_ENVIRONMENT === "production"
    ? "production"
    : "sandbox";
export const quickBooksConfigured = () =>
  Boolean(
    process.env.QUICKBOOKS_CLIENT_ID &&
    process.env.QUICKBOOKS_CLIENT_SECRET &&
    process.env.QUICKBOOKS_REDIRECT_URI &&
    process.env.QUICKBOOKS_TOKEN_KEY,
  );
function encryptionKey() {
  const key = Buffer.from(process.env.QUICKBOOKS_TOKEN_KEY || "", "base64");
  if (key.length !== 32)
    throw new InvoiceError("QuickBooks connection setup is incomplete.", 503);
  return key;
}
export function encryptQuickBooksToken(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  return [iv, cipher.update(token, "utf8"), cipher.final(), cipher.getAuthTag()]
    .map((part) => part.toString("base64"))
    .join(".");
}
function decryptToken(value: string) {
  const [iv, encrypted, final, tag] = value
    .split(".")
    .map((part) => Buffer.from(part, "base64"));
  const cipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAuthTag(tag);
  return Buffer.concat([
    cipher.update(encrypted),
    cipher.update(final),
    cipher.final(),
  ]).toString("utf8");
}
export async function exchangeQuickBooksToken(body: URLSearchParams) {
  const response = await fetch(
    "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.QUICKBOOKS_CLIENT_ID}:${process.env.QUICKBOOKS_CLIENT_SECRET}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    },
  );
  if (!response.ok)
    throw new InvoiceError("Please reconnect QuickBooks to continue.", 503);
  const token = await response.json();
  if (
    !token.access_token ||
    !token.refresh_token ||
    !Number.isFinite(token.expires_in)
  )
    throw new InvoiceError(
      "QuickBooks did not return a valid connection.",
      502,
    );
  return {
    accessToken: encryptQuickBooksToken(token.access_token),
    refreshToken: encryptQuickBooksToken(token.refresh_token),
    expiresAt: new Date(Date.now() + token.expires_in * 1000),
  };
}
export async function getQuickBooksConnection() {
  if (!quickBooksConfigured())
    throw new InvoiceError(
      "QuickBooks needs its one-time connection setup before you can send invoices.",
      503,
    );
  return db.$transaction(
    async (tx) => {
      // Serialize token rotation across serverless instances, not just this process.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(19870921)`;
      let connection = await tx.quickBooksConnection.findUnique({
        where: { id: "company" },
      });
      if (!connection || connection.environment !== quickBooksEnvironment())
        throw new InvoiceError("Connect QuickBooks to continue.", 503);
      if (connection.expiresAt.getTime() < Date.now() + 60_000) {
        const tokens = await exchangeQuickBooksToken(
          new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: decryptToken(connection.refreshToken),
          }),
        );
        connection = await tx.quickBooksConnection.update({
          where: { id: "company" },
          data: tokens,
        });
      }
      return {
        realmId: connection.realmId,
        accessToken: decryptToken(connection.accessToken),
      };
    },
    { timeout: 25_000, maxWait: 25_000 },
  );
}
export function quickBooksUrl(entity: string, id: string) {
  const host =
    quickBooksEnvironment() === "production"
      ? "https://qbo.intuit.com"
      : "https://sandbox.qbo.intuit.com";
  return `${host}/app/${entity === "Invoice" ? "invoice" : entity === "Bill" ? "bill" : "expense"}?txnId=${encodeURIComponent(id)}`;
}
export async function quickBooksRequest(
  path: string,
  init: RequestInit = {},
  realmId?: string,
): Promise<QboResponse> {
  const connection = await getQuickBooksConnection();
  if (realmId && realmId !== connection.realmId)
    throw new InvoiceError(
      "This invoice belongs to a different QuickBooks company. Reconnect the original company.",
      409,
    );
  const base =
    quickBooksEnvironment() === "production"
      ? "https://quickbooks.api.intuit.com"
      : "https://sandbox-quickbooks.api.intuit.com";
  const response = await fetch(
    `${base}/v3/company/${encodeURIComponent(connection.realmId)}/${path}`,
    {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${connection.accessToken}`,
        ...(init.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...init.headers,
      },
      signal: AbortSignal.timeout(25_000),
      cache: "no-store",
    },
  ).catch(() => {
    throw new InvoiceError(
      "QuickBooks did not respond. Your invoice is saved; retry to check its status safely.",
      502,
    );
  });
  if (!response.ok) {
    if (response.status === 401)
      throw new InvoiceError(
        "Your QuickBooks connection expired. Reconnect and retry.",
        503,
      );
    if (response.status === 429)
      throw new InvoiceError(
        "QuickBooks is busy. Your invoice is saved; retry shortly.",
        429,
      );
    throw new InvoiceError(
      "QuickBooks could not accept this invoice. Check the customer, supplier, account, and tax settings, then retry.",
      502,
    );
  }
  return response.json();
}
export async function quickBooksQuery(
  entity: string,
  where = "Active = true",
  realmId?: string,
) {
  const result: QboRecord[] = [];
  for (let start = 1; start <= 10_001; start += 1000) {
    const query = `select * from ${entity}${where ? ` where ${where}` : ""} startposition ${start} maxresults 1000`;
    const response = await quickBooksRequest(
      `query?query=${encodeURIComponent(query)}`,
      {},
      realmId,
    );
    const page = response.QueryResponse?.[entity] || [];
    result.push(...page);
    if (page.length < 1000) return result;
  }
  throw new InvoiceError(
    "There are too many QuickBooks records to load. Please narrow the account's active lists.",
    422,
  );
}
export async function quickBooksReference(
  entity: string,
  id: string,
  realmId: string,
) {
  if (!/^\d+$/.test(id))
    throw new InvoiceError(`Choose a QuickBooks ${entity.toLowerCase()}.`);
  const result = await quickBooksRequest(
    `${entity.toLowerCase()}/${id}`,
    {},
    realmId,
  );
  const value = result[entity] as QboRecord | undefined;
  if (!value || value.Active === false)
    throw new InvoiceError(
      `Choose an active QuickBooks ${entity.toLowerCase()}.`,
    );
  if (value.CurrencyRef && value.CurrencyRef.value !== "USD")
    throw new InvoiceError("Choose a USD account, customer, or supplier.");
  return value;
}
export async function assertUSQuickBooks(realmId: string) {
  const response = await quickBooksRequest(
    `companyinfo/${encodeURIComponent(realmId)}`,
    {},
    realmId,
  );
  const info = response.CompanyInfo as { Country?: string } | undefined;
  if (info?.Country !== "US")
    throw new InvoiceError(
      "This invoice integration currently supports US QuickBooks companies with USD transactions.",
      422,
    );
}

export async function saveQuickBooksDefaults(values: {
  expenseAccountId?: string;
  paymentAccountId?: string;
  itemId?: string;
}) {
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(19870921)`;
    const connection = await tx.quickBooksConnection.findUniqueOrThrow({
      where: { id: "company" },
    });
    await tx.quickBooksConnection.update({
      where: { id: "company" },
      data: {
        defaults: {
          ...((connection.defaults as Record<string, string>) || {}),
          ...values,
        },
      },
    });
  });
}

export async function exportToQuickBooks(
  id: string,
  entity: "Bill" | "Purchase" | "Invoice",
  realmId: string,
  payload: Record<string, unknown>,
) {
  const marker = `TalentEarth:${id}`;
  const storedPayload = { ...payload, PrivateNote: marker };
  const record = await db.quickBooksExport.upsert({
    where: { id },
    update: {},
    create: {
      id,
      entity,
      realmId,
      payload: storedPayload as Prisma.InputJsonValue,
    },
  });
  if (record.realmId !== realmId || record.entity !== entity)
    throw new InvoiceError(
      "This invoice already has a QuickBooks submission. Reconnect the original company and retry it.",
      409,
    );
  if (record.remoteId) return record;
  if (JSON.stringify(record.payload) !== JSON.stringify(storedPayload)) {
    // JSONB reorders object keys: compare canonical hashes instead of string order.
    if (canonical(record.payload) !== canonical(storedPayload))
      throw new InvoiceError(
        "A previous submission is pending. Retry the original details before changing this invoice.",
        409,
      );
  }
  const lock = await db.quickBooksExport.updateMany({
    where: {
      id,
      OR: [
        { lockedAt: null },
        { lockedAt: { lt: new Date(Date.now() - 120_000) } },
      ],
    },
    data: { lockedAt: new Date() },
  });
  if (!lock.count)
    throw new InvoiceError(
      "This invoice is already being sent. Wait a moment and refresh.",
      409,
    );
  try {
    // Recover accepted requests after a lost response, even beyond Intuit's request-id window.
    const request = record.payload as Record<string, unknown>;
    const date = String(request.TxnDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      throw new InvoiceError("Invalid invoice date.");
    const sameDay = await quickBooksQuery(
      entity,
      `TxnDate = '${date}'`,
      realmId,
    );
    const recovered = sameDay.find((item) => item.PrivateNote === marker);
    if (recovered)
      return await db.quickBooksExport.update({
        where: { id },
        data: { remoteId: recovered.Id },
      });
    if (entity !== "Invoice") {
      const supplierRef = request.VendorRef || request.EntityRef;
      const number = String(request.DocNumber || "")
        .replaceAll("\\", "\\\\")
        .replaceAll("'", "\\'");
      const candidates = await quickBooksQuery(
        entity,
        `DocNumber = '${number}'`,
        realmId,
      );
      const duplicates = candidates.filter(
        (item) =>
          String(item.DocNumber || "") === String(request.DocNumber || "") &&
          canonical(
            (item.VendorRef && {
              value: (item.VendorRef as { value: string }).value,
            }) ||
              (item.EntityRef && {
                value: (item.EntityRef as { value: string }).value,
              }),
          ) === canonical(supplierRef),
      );
      if (duplicates.length) {
        type ExpenseLine = {
          Amount?: number;
          AccountBasedExpenseLineDetail?: { CustomerRef?: { value: string } };
        };
        const requestedLines = request.Line as ExpenseLine[];
        const candidate = duplicates[0];
        const candidateLines = candidate.Line as ExpenseLine[] | undefined;
        const amount = requestedLines.reduce(
          (sum, line) => sum + Math.round((line.Amount || 0) * 100),
          0,
        );
        const customerId =
          requestedLines[0]?.AccountBasedExpenseLineDetail?.CustomerRef?.value;
        if (
          duplicates.length === 1 &&
          candidate.TxnDate === date &&
          Math.round(Number(candidate.TotalAmt) * 100) === amount &&
          (!candidate.CurrencyRef || candidate.CurrencyRef.value === "USD") &&
          candidateLines?.length &&
          candidateLines.every(
            (line) =>
              line.AccountBasedExpenseLineDetail?.CustomerRef?.value ===
              customerId,
          )
        ) {
          return await db.quickBooksExport.update({
            where: { id },
            data: { remoteId: candidate.Id },
          });
        }
        throw new InvoiceError(
          "This invoice number already appears for this supplier in QuickBooks, but its date, amount, or job differs. Review that transaction in QuickBooks before retrying.",
          409,
        );
      }
    }
    const requestId = createHash("sha256")
      .update(id)
      .digest("hex")
      .slice(0, 40);
    const response = await quickBooksRequest(
      `${entity.toLowerCase()}?requestid=${requestId}`,
      { method: "POST", body: JSON.stringify(request) },
      realmId,
    );
    const remote = response[entity] as { Id?: string } | undefined;
    if (!remote?.Id)
      throw new InvoiceError(
        "QuickBooks has not confirmed this invoice. Retry to check its status.",
        502,
      );
    return await db.quickBooksExport.update({
      where: { id },
      data: { remoteId: remote.Id },
    });
  } finally {
    await db.quickBooksExport.update({
      where: { id },
      data: { lockedAt: null },
    });
  }
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
export async function attachSupplierInvoice(
  exportId: string,
  document: { fileName: string; mimeType: string; fileData: Uint8Array },
) {
  const record = await db.quickBooksExport.findUniqueOrThrow({
    where: { id: exportId },
  });
  if (record.attachmentId || !record.remoteId) return record;
  const upload = new FormData();
  const extension =
    document.mimeType === "application/pdf"
      ? ".pdf"
      : document.mimeType === "image/png"
        ? ".png"
        : ".jpg";
  const safeName =
    document.fileName
      .replace(/[^a-zA-Z0-9._ -]/g, "_")
      .replace(/\.[^.]*$/, "") + extension;
  upload.append(
    "file_metadata_01",
    new Blob(
      [
        JSON.stringify({
          FileName: safeName,
          ContentType: document.mimeType,
          AttachableRef: [
            {
              EntityRef: { type: record.entity, value: record.remoteId },
              IncludeOnSend: false,
            },
          ],
        }),
      ],
      { type: "application/json" },
    ),
    "metadata.json",
  );
  upload.append(
    "file_content_01",
    new Blob([new Uint8Array(document.fileData)], { type: document.mimeType }),
    safeName,
  );
  const requestId = createHash("sha256")
    .update(`attachment:${exportId}`)
    .digest("hex")
    .slice(0, 40);
  const response = await quickBooksRequest(
    `upload?requestid=${requestId}`,
    { method: "POST", body: upload },
    record.realmId,
  );
  const attachments = response.AttachableResponse as
    | { Attachable?: { Id?: string } }[]
    | undefined;
  const attachmentId = attachments?.[0]?.Attachable?.Id;
  if (!attachmentId)
    throw new InvoiceError(
      "The cost is in QuickBooks, but its PDF still needs uploading. Retry to attach it without creating another cost.",
      502,
    );
  return db.quickBooksExport.update({
    where: { id: exportId },
    data: { attachmentId },
  });
}
