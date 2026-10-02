import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import {
  InvoiceError,
  invoiceError,
  requireSameOrigin,
} from "@/lib/invoice-api";
import { supplierDetailsSchema } from "@/lib/invoice-workflow";
import {
  assertUSQuickBooks,
  attachSupplierInvoice,
  exportToQuickBooks,
  getQuickBooksConnection,
  quickBooksReference,
  quickBooksUrl,
  saveQuickBooksDefaults,
} from "@/lib/quickbooks";

export const maxDuration = 120;
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> },
) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    requireSameOrigin(req);
    const { id, documentId } = await params;
    const document = await db.supplierInvoice.findFirst({
      where: { id: documentId, projectId: id },
    });
    if (!document || document.status !== "APPROVED")
      throw new InvoiceError(
        "Approve the supplier invoice before sending it to QuickBooks.",
        409,
      );
    const { realmId } = await getQuickBooksConnection();
    const exportId = `supplier_${documentId}`;
    const previous = await db.quickBooksExport.findUnique({
      where: { id: exportId },
    });
    if (previous) {
      if (previous.realmId !== realmId)
        throw new InvoiceError(
          "Reconnect the QuickBooks company used for this invoice.",
          409,
        );
      await exportToQuickBooks(
        exportId,
        previous.entity as "Bill" | "Purchase",
        realmId,
        previous.payload as Record<string, unknown>,
      );
    } else {
      const details = supplierDetailsSchema.parse(document.details);
      const { customerId, vendorId, expenseAccountId, paymentAccountId } =
        await req.json();
      await assertUSQuickBooks(realmId);
      const [, , expense] = await Promise.all([
        quickBooksReference("Customer", customerId, realmId),
        quickBooksReference("Vendor", vendorId, realmId),
        quickBooksReference("Account", expenseAccountId, realmId),
      ]);
      if (
        !["Expense", "Cost of Goods Sold", "Other Expense"].includes(
          expense.AccountType || "",
        )
      )
        throw new InvoiceError(
          "Choose an expense or cost of goods sold account.",
        );
      let paymentType: string | undefined;
      if (details.paymentStatus === "PAID") {
        const payment = await quickBooksReference(
          "Account",
          paymentAccountId,
          realmId,
        );
        if (!["Bank", "Credit Card"].includes(payment.AccountType || ""))
          throw new InvoiceError(
            "Choose the bank or credit card account used to pay this invoice.",
          );
        paymentType =
          payment.AccountType === "Credit Card" ? "CreditCard" : "Cash";
      }
      const payload = {
        DocNumber: details.invoiceNumber,
        TxnDate: details.date,
        CurrencyRef: { value: "USD" },
        ...(details.paymentStatus === "UNPAID"
          ? {
              VendorRef: { value: vendorId },
              ...(details.dueDate ? { DueDate: details.dueDate } : {}),
            }
          : {
              EntityRef: { value: vendorId },
              AccountRef: { value: paymentAccountId },
              PaymentType: paymentType,
            }),
        Line: details.lines.map((line) => ({
          Amount: line.amount,
          Description: line.description,
          DetailType: "AccountBasedExpenseLineDetail",
          AccountBasedExpenseLineDetail: {
            AccountRef: { value: expenseAccountId },
            CustomerRef: { value: customerId },
            BillableStatus: "NotBillable",
          },
        })),
      };
      await db.project.update({
        where: { id },
        data: { quickBooksCustomerId: customerId, quickBooksRealmId: realmId },
      });
      await exportToQuickBooks(
        exportId,
        details.paymentStatus === "PAID" ? "Purchase" : "Bill",
        realmId,
        payload,
      );
      await saveQuickBooksDefaults({
        expenseAccountId,
        ...(details.paymentStatus === "PAID" ? { paymentAccountId } : {}),
      });
    }
    const result = await attachSupplierInvoice(exportId, document);
    return NextResponse.json({
      success: true,
      url: result.remoteId
        ? quickBooksUrl(result.entity, result.remoteId)
        : null,
    });
  } catch (error) {
    return invoiceError(error);
  }
}
