// Smoke-check only synthetic data. Never writes invoice or accounting records.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { extractSupplierInvoice } from "../src/lib/supplier-extraction.ts";
import { createCustomerInvoicePdf } from "../src/lib/customer-invoice-pdf.ts";

// Only this synthetic smoke check prints provider diagnostic messages.
const nativeFetch = globalThis.fetch;
globalThis.fetch = async (...args) => {
  const response = await nativeFetch(...args);
  if (!response.ok) {
    const failure = await response
      .clone()
      .json()
      .catch(() => ({}));
    const message = String(failure.error?.message || "");
    console.warn("Synthetic reader API diagnostic:", {
      status: response.status,
      message: process.env.OPENAI_API_KEY
        ? message
            .replaceAll(process.env.OPENAI_API_KEY, "[REDACTED]")
            .slice(0, 500)
        : message.slice(0, 500),
    });
  }
  return response;
};

const pdf = createCustomerInvoicePdf({
  projectId: "synthetic-reader-check",
  projectName: "Sample panels",
  customerName: "Example Customer",
  invoiceDate: new Date("2026-09-24"),
  dueDate: new Date("2026-10-24"),
  lineItems: [{ description: "Printed panels", amount: 115 }],
});
const file = {
  fileName: "synthetic-invoice.pdf",
  mimeType: "application/pdf",
  fileData: new Uint8Array(await pdf.arrayBuffer()),
};
const result = await extractSupplierInvoice(file);
globalThis.fetch = nativeFetch;
assert.equal(result.details.total, 115);
console.log(
  "Synthetic invoice reader:",
  result.warning.startsWith("Details were")
    ? "AI passed"
    : "PDF fallback passed; AI unavailable",
);
delete process.env.OPENAI_API_KEY;
const fallback = await extractSupplierInvoice(file);
assert.equal(fallback.details.total, 115);
assert.match(fallback.warning, /^Basic PDF reading/);
console.log("Synthetic PDF fallback: passed");

// Verify the deployed function trace includes the native runtime dependency.
for (const route of ["route", "[documentId]/route"]) {
  const trace = JSON.parse(
    readFileSync(
      `.next/server/app/api/admin/projects/[id]/supplier-invoices/${route}.js.nft.json`,
      "utf8",
    ),
  );
  assert.ok(
    trace.files.some((file) => file.includes("@napi-rs/canvas/index.js")),
    "Missing canvas runtime in function trace",
  );
  assert.ok(
    trace.files.some((file) => /canvas.*\.node$/.test(file)),
    "Missing native canvas binary in function trace",
  );
}
console.log("Invoice function dependency traces: passed");
