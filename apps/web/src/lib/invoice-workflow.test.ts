import assert from "node:assert/strict";
import test from "node:test";
import {
  customerInvoiceLines,
  dateOnly,
  invoiceMimeType,
  normalizeInvoiceCurrency,
  supplierDetailsSchema,
  supplierDuplicateKey,
} from "./invoice-workflow.ts";

const valid = {
  supplier: "Sample Print Shop",
  invoiceNumber: "INV-101",
  date: "2026-09-21",
  dueDate: "2026-10-21",
  currency: "USD",
  paymentStatus: "UNPAID",
  total: 115,
  lines: [
    {
      description: "Printed panels",
      category: "OUTSIDE_PRINTING",
      amount: 100,
    },
    { description: "Delivery", category: "COURIER_FREIGHT", amount: 15 },
  ],
};
test("supplier totals must reconcile in cents, including freight and tax", () => {
  assert.equal(supplierDetailsSchema.safeParse(valid).success, true);
  assert.equal(
    supplierDetailsSchema.safeParse({ ...valid, total: 100 }).success,
    false,
  );
  assert.equal(
    supplierDetailsSchema.safeParse({
      ...valid,
      total: 0.3,
      lines: [
        { description: "Part", category: "MATERIALS", amount: 0.1 },
        { description: "Part 2", category: "MATERIALS", amount: 0.2 },
      ],
    }).success,
    true,
  );
});
test("US-dollar labels on saved invoices approve as USD without changing amounts", () => {
  for (const currency of [
    "US$",
    " usd ",
    "U.S.$",
    "$US",
    "US Dollars",
    "United States dollars",
  ]) {
    const parsed = supplierDetailsSchema.parse({ ...valid, currency });
    assert.equal(parsed.currency, "USD");
    assert.equal(parsed.total, valid.total);
    assert.deepEqual(parsed.lines, valid.lines);
  }
});
test("foreign and ambiguous currencies are never silently converted to USD", () => {
  for (const currency of [
    "CAD",
    "CA$",
    "AUD",
    "A$",
    "MXN",
    "EUR",
    "$",
    "dollars",
    "",
    null,
  ]) {
    assert.notEqual(normalizeInvoiceCurrency(currency), "USD");
    assert.equal(
      supplierDetailsSchema.safeParse({ ...valid, currency }).success,
      false,
    );
  }
});
test("invalid calendar dates, missing suppliers, and foreign-currency costs cannot be approved", () => {
  assert.equal(dateOnly.safeParse("2026-02-30").success, false);
  assert.equal(dateOnly.safeParse("2024-02-29").success, true);
  for (const change of [
    { supplier: " " },
    { invoiceNumber: "" },
    { currency: "CAD" },
    { dueDate: "2026-08-01" },
  ])
    assert.equal(
      supplierDetailsSchema.safeParse({ ...valid, ...change }).success,
      false,
    );
});
test("duplicates normalize supplier whitespace and invoice number case", () => {
  assert.equal(
    supplierDuplicateKey(" SAMPLE   Print Shop ", " inv-101 "),
    supplierDuplicateKey(valid.supplier, valid.invoiceNumber),
  );
});
test("file type is checked from bytes, not an uploaded filename", () => {
  assert.equal(invoiceMimeType(Buffer.from("<script>bad</script>")), null);
  assert.equal(invoiceMimeType(Buffer.from("%PDF-1.4\n")), "application/pdf");
  assert.equal(
    invoiceMimeType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])),
    "image/jpeg",
  );
});
test("customer invoice uses server retail amounts, with separate tax choices", () => {
  const lines = customerInvoiceLines(
    [
      { id: "print", amount: 167.69 },
      { id: "freight", amount: 15 },
    ],
    [
      { id: "print", description: "Finished panels", taxable: true },
      { id: "freight", description: "Delivery", taxable: false },
    ],
    "7",
  );
  assert.equal(lines[0].Amount, 167.69);
  assert.equal(lines[1].Amount, 15);
  assert.equal(lines[0].SalesItemLineDetail.TaxCodeRef.value, "TAX");
  assert.equal(lines[1].SalesItemLineDetail.TaxCodeRef.value, "NON");
  assert.equal(JSON.stringify(lines).includes("supplier"), false);
});
test("duplicate, removed, or stale cost lines cannot create a customer invoice", () => {
  const prices = [
    { id: "a", amount: 10 },
    { id: "b", amount: 20 },
  ];
  const a = { id: "a", description: "Service", taxable: false };
  assert.throws(() => customerInvoiceLines(prices, [a, a], "7"));
  assert.throws(() => customerInvoiceLines(prices, [a], "7"));
  assert.throws(() =>
    customerInvoiceLines(prices, [a, { ...a, id: "c" }], "7"),
  );
});
