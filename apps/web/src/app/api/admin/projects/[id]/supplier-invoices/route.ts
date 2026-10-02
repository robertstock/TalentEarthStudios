import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import {
  InvoiceError,
  invoiceError,
  limitedBody,
  requireSameOrigin,
} from "@/lib/invoice-api";
import {
  emptySupplierDetails,
  invoiceMimeType,
  MAX_INVOICE_BYTES,
} from "@/lib/invoice-workflow";
import { extractSupplierInvoice } from "@/lib/supplier-extraction";
import { quickBooksUrl } from "@/lib/quickbooks";

export const runtime = "nodejs";
export const maxDuration = 60;
type Context = { params: Promise<{ id: string }> };
export async function GET(_req: Request, { params }: Context) {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const { id } = await params;
    const documents = await db.supplierInvoice.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        projectId: true,
        fileName: true,
        status: true,
        details: true,
        warning: true,
      },
    });
    const exports = await db.quickBooksExport.findMany({
      where: { id: { in: documents.map((doc) => `supplier_${doc.id}`) } },
      select: { id: true, remoteId: true, attachmentId: true, entity: true },
    });
    return NextResponse.json(
      {
        documents: documents.map((doc) => {
          const record = exports.find(
            (item) => item.id === `supplier_${doc.id}`,
          );
          return {
            ...doc,
            export: record
              ? {
                  ...record,
                  url: record.remoteId
                    ? quickBooksUrl(record.entity, record.remoteId)
                    : null,
                }
              : null,
          };
        }),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return invoiceError(error);
  }
}
export async function POST(req: Request, { params }: Context) {
  const { error, session } = await requireAdmin();
  if (error) return error;
  try {
    requireSameOrigin(req);
    const { id } = await params;
    const project = await db.project.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!project) throw new InvoiceError("Job not found.", 404);
    if (project.status === "CANCELLED")
      throw new InvoiceError(
        "Reopen the job before adding supplier invoices.",
        409,
      );
    const body = await limitedBody(req, MAX_INVOICE_BYTES + 32_000);
    const form = await new Response(new Uint8Array(body), {
      headers: { "Content-Type": req.headers.get("content-type") || "" },
    }).formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.size || file.size > MAX_INVOICE_BYTES)
      throw new InvoiceError("Choose a PDF, PNG, or JPG smaller than 4 MB.");
    const fileData = Buffer.from(await file.arrayBuffer());
    const mimeType = invoiceMimeType(fileData);
    if (!mimeType) throw new InvoiceError("Choose a PDF, PNG, or JPG invoice.");
    const sha256 = createHash("sha256").update(fileData).digest("hex");
    const existing = await db.supplierInvoice.findUnique({
      where: { sha256 },
      select: { id: true, projectId: true },
    });
    if (existing) {
      if (existing.projectId !== id)
        throw new InvoiceError(
          "This file is already saved on another job. Review that invoice before adding it again.",
          409,
        );
      return NextResponse.json({ documentId: existing.id, duplicate: true });
    }
    const document = await db.supplierInvoice.create({
      data: {
        projectId: id,
        fileName: file.name.replace(/[\r\n\x00]/g, "").slice(0, 200),
        mimeType,
        fileData,
        sha256,
        details: emptySupplierDetails(),
        uploadedById: session!.user.id,
        warning:
          "The original is saved. Check or complete the details before approving.",
      },
    });
    const extracted = await extractSupplierInvoice(document);
    await db.supplierInvoice.update({
      where: { id: document.id },
      data: extracted,
    });
    return NextResponse.json({ documentId: document.id });
  } catch (error) {
    return invoiceError(error);
  }
}
