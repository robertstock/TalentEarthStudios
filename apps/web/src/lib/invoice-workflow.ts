import { z } from "zod";

export const MAX_INVOICE_BYTES = 4_000_000;
export const invoiceCategories = [
  "OUTSIDE_PRINTING",
  "COURIER_FREIGHT",
  "MATERIALS",
  "PROTOTYPE",
  "CHANGE_ORDER",
  "OUTSIDE_LABOR",
  "EQUIPMENT_RENTAL",
  "TRAVEL",
  "OTHER",
] as const;
export const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T12:00:00Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  }, "Enter a valid date.");
const money = z
  .number()
  .finite()
  .positive()
  .max(99_999_999)
  .refine(
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.00001,
    "Use no more than two decimal places.",
  );

// Normalize explicit US-dollar labels, without treating ambiguous "$" or a
// different currency as USD. This changes notation only, never money amounts.
export function normalizeInvoiceCurrency(value: unknown): string {
  if (typeof value !== "string") return "";
  const currency = value.trim().toUpperCase();
  const compact = currency.replace(/[.\s]/g, "");
  return [
    "USD",
    "US$",
    "$US",
    "USD$",
    "USDOLLAR",
    "USDOLLARS",
    "UNITEDSTATESDOLLAR",
    "UNITEDSTATESDOLLARS",
  ].includes(compact)
    ? "USD"
    : currency;
}

export const supplierDetailsSchema = z
  .object({
    supplier: z.string().trim().min(1, "Enter the supplier name.").max(150),
    invoiceNumber: z
      .string()
      .trim()
      .min(1, "Enter the supplier invoice or receipt number.")
      .max(21),
    date: dateOnly,
    dueDate: z.union([dateOnly, z.literal("")]),
    currency: z.preprocess(
      normalizeInvoiceCurrency,
      z.literal("USD", {
        errorMap: () => ({
          message:
            "This tracker currently records costs in USD. Convert this invoice before approving it.",
        }),
      }),
    ),
    paymentStatus: z.enum(["UNPAID", "PAID"]),
    total: money,
    lines: z
      .array(
        z.object({
          description: z.string().trim().min(1).max(500),
          category: z.enum(invoiceCategories),
          amount: money,
        }),
      )
      .min(1)
      .max(100),
  })
  .superRefine((value, ctx) => {
    if (
      Math.round(value.total * 100) !==
      value.lines.reduce((sum, line) => sum + Math.round(line.amount * 100), 0)
    )
      ctx.addIssue({
        code: "custom",
        message:
          "Cost lines must add up to the supplier invoice total, including tax and freight.",
        path: ["lines"],
      });
    if (value.dueDate && value.dueDate < value.date)
      ctx.addIssue({
        code: "custom",
        message: "The due date cannot be before the invoice date.",
        path: ["dueDate"],
      });
  });
// Extracted drafts can contain other currencies; approval validates USD above.
export type SupplierDetails = Omit<
  z.infer<typeof supplierDetailsSchema>,
  "currency"
> & { currency: string };
export type SupplierDocument = {
  id: string;
  projectId: string;
  fileName: string;
  status: string;
  details: SupplierDetails;
  warning: string | null;
  export: {
    remoteId: string | null;
    attachmentId: string | null;
    entity: string;
    url: string | null;
  } | null;
};
export type QuickBooksOption = { id: string; name: string; type?: string };
export type QuickBooksOptions = {
  configured: boolean;
  connected: boolean;
  environment: string;
  realmId?: string;
  message?: string;
  customers: QuickBooksOption[];
  vendors: QuickBooksOption[];
  accounts: QuickBooksOption[];
  items: QuickBooksOption[];
  defaults?: {
    expenseAccountId?: string;
    paymentAccountId?: string;
    itemId?: string;
  };
};
export const emptyQuickBooksOptions: QuickBooksOptions = {
  configured: false,
  connected: false,
  environment: "sandbox",
  customers: [],
  vendors: [],
  accounts: [],
  items: [],
};
export function supplierDuplicateKey(supplier: string, invoiceNumber: string) {
  return `${supplier.trim().toLocaleLowerCase().replace(/\s+/g, " ")}|${invoiceNumber.trim().toLocaleLowerCase()}`;
}
export function invoiceMimeType(bytes: Uint8Array) {
  if (Buffer.from(bytes.subarray(0, 5)).toString() === "%PDF-")
    return "application/pdf";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if (
    Buffer.from(bytes.subarray(0, 8)).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    )
  )
    return "image/png";
  return null;
}
export function emptySupplierDetails(): SupplierDetails {
  return {
    supplier: "",
    invoiceNumber: "",
    date: "",
    dueDate: "",
    currency: "USD",
    paymentStatus: "UNPAID",
    total: 0,
    lines: [{ description: "", category: "OTHER", amount: 0 }],
  };
}

// Retrying extraction fills gaps without replacing a saved or unsaved review.
export function fillSupplierDetails(
  current: SupplierDetails,
  extracted: SupplierDetails,
): SupplierDetails {
  const hasLines = current.lines.some(
    (line) => line.description.trim() || line.amount > 0,
  );
  const untouched =
    !current.supplier &&
    !current.invoiceNumber &&
    !current.date &&
    !current.total &&
    !hasLines;
  return {
    ...current,
    supplier: current.supplier || extracted.supplier,
    invoiceNumber: current.invoiceNumber || extracted.invoiceNumber,
    date: current.date || extracted.date,
    dueDate: current.dueDate || extracted.dueDate,
    total: current.total || extracted.total,
    currency: normalizeInvoiceCurrency(
      untouched ? extracted.currency : current.currency,
    ),
    paymentStatus: untouched ? extracted.paymentStatus : current.paymentStatus,
    lines: hasLines ? current.lines : extracted.lines,
  };
}

export const customerDraftSchema = z
  .object({
    date: dateOnly,
    dueDate: dateOnly,
    customerId: z.string().max(100),
    itemId: z.string().max(100),
    pricingVersion: z.string().min(1),
    lines: z
      .array(
        z.object({
          id: z.string(),
          description: z.string().trim().min(1).max(1000),
          taxable: z.boolean(),
        }),
      )
      .min(1)
      .max(100),
  })
  .refine(
    (value) => value.dueDate >= value.date,
    "The due date cannot be before the invoice date.",
  );
export type CustomerDraft = z.infer<typeof customerDraftSchema>;

export function customerInvoiceLines(
  pricedLines: { id: string; amount: number }[],
  draftLines: CustomerDraft["lines"],
  itemId: string,
) {
  if (
    pricedLines.length !== draftLines.length ||
    new Set(draftLines.map((line) => line.id)).size !== pricedLines.length
  )
    throw new Error("The job costs changed. Reopen the invoice preview.");
  return pricedLines.map((line) => {
    const draft = draftLines.find((item) => item.id === line.id);
    if (!draft)
      throw new Error("The job costs changed. Reopen the invoice preview.");
    return {
      Amount: line.amount,
      Description: draft.description,
      DetailType: "SalesItemLineDetail",
      SalesItemLineDetail: {
        ItemRef: { value: itemId },
        Qty: 1,
        UnitPrice: line.amount,
        TaxCodeRef: { value: draft.taxable ? "TAX" : "NON" },
      },
    };
  });
}
