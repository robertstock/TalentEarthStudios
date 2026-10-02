import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import {
  InvoiceError,
  invoiceError,
  requireSameOrigin,
} from "@/lib/invoice-api";
import {
  fillSupplierDetails,
  type SupplierDetails,
  supplierDetailsSchema,
  supplierDuplicateKey,
} from "@/lib/invoice-workflow";
import { extractSupplierInvoice } from "@/lib/supplier-extraction";

export const runtime = "nodejs";
export const maxDuration = 60;

type Context = { params: Promise<{ id: string; documentId: string }> };
export async function POST(req: Request, { params }: Context) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    requireSameOrigin(req);
    const { id, documentId } = await params;
    const document = await db.supplierInvoice.findFirst({
      where: { id: documentId, projectId: id },
      include: { project: { select: { status: true } } },
    });
    if (!document) throw new InvoiceError("Invoice not found.", 404);
    if (document.status !== "DRAFT" || document.project.status === "CANCELLED")
      throw new InvoiceError(
        "Only unapproved invoices on open jobs can be read again.",
        409,
      );
    const extracted = await extractSupplierInvoice(document);
    const details = fillSupplierDetails(
      document.details as SupplierDetails,
      extracted.details,
    );
    const updated = await db.supplierInvoice.updateMany({
      where: { id: documentId, status: "DRAFT", updatedAt: document.updatedAt },
      data: { details, warning: extracted.warning },
    });
    if (!updated.count)
      throw new InvoiceError(
        "This invoice changed while it was being read. Reopen it to see the latest review.",
        409,
      );
    return NextResponse.json({ details, warning: extracted.warning });
  } catch (error) {
    return invoiceError(error);
  }
}
export async function GET(_req: Request, { params }: Context) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const { id, documentId } = await params;
    const document = await db.supplierInvoice.findFirst({
      where: { id: documentId, projectId: id },
      select: { fileData: true, mimeType: true, fileName: true },
    });
    if (!document) throw new InvoiceError("Invoice not found.", 404);
    return new Response(new Uint8Array(document.fileData), {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(document.fileName)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox",
      },
    });
  } catch (error) {
    return invoiceError(error);
  }
}
export async function PATCH(req: Request, { params }: Context) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    requireSameOrigin(req);
    const { id, documentId } = await params;
    const body = await req.json();
    if (!["save", "approve"].includes(body.action))
      throw new InvoiceError("Choose save or approve.");
    const details = supplierDetailsSchema.parse(body.details);
    await db.$transaction(async (tx) => {
      const document = await tx.supplierInvoice.findFirst({
        where: { id: documentId, projectId: id },
        include: { project: { select: { status: true } } },
      });
      if (!document) throw new InvoiceError("Invoice not found.", 404);
      if (document.project.status === "CANCELLED")
        throw new InvoiceError("Reopen the job before changing costs.", 409);
      if (document.status === "APPROVED") return; // Retrying approval must not add another cost.
      const updated = await tx.supplierInvoice.updateMany({
        where: { id: documentId, status: "DRAFT" },
        data: {
          details,
          duplicateKey: supplierDuplicateKey(
            details.supplier,
            details.invoiceNumber,
          ),
          ...(body.action === "approve"
            ? { status: "APPROVED", approvedAt: new Date() }
            : {}),
        },
      });
      if (!updated.count) return;
      if (body.action === "approve")
        await tx.vendorBill.createMany({
          data: details.lines.map((line) => ({
            projectId: id,
            supplierInvoiceId: documentId,
            category: line.category,
            vendorName: line.description,
            amount: line.amount,
            status: details.paymentStatus,
            date: new Date(`${details.date}T12:00:00Z`),
            documentUrl: `/api/admin/projects/${id}/supplier-invoices/${documentId}`,
          })),
        });
    });
    const bills = await db.vendorBill.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ success: true, bills });
  } catch (error) {
    return invoiceError(error);
  }
}
export async function DELETE(req: Request, { params }: Context) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    requireSameOrigin(req);
    const { id, documentId } = await params;
    const result = await db.supplierInvoice.deleteMany({
      where: { id: documentId, projectId: id, status: "DRAFT" },
    });
    if (!result.count)
      throw new InvoiceError("Only unapproved uploads can be removed.", 409);
    return NextResponse.json({ success: true });
  } catch (error) {
    return invoiceError(error);
  }
}
