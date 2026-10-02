import { isActivePriceApprover, canApprovePrice, hasPriceApproval, projectPriceVersion } from "@/lib/price-approval";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import {
  InvoiceError,
  invoiceError,
  requireSameOrigin,
} from "@/lib/invoice-api";
import {
  customerDraftSchema,
  customerInvoiceLines,
} from "@/lib/invoice-workflow";
import { calculateProjectPricing } from "@/lib/project-pricing";
import {
  assertUSQuickBooks,
  exportToQuickBooks,
  getQuickBooksConnection,
  quickBooksReference,
  quickBooksRequest,
  quickBooksUrl,
  saveQuickBooksDefaults,
} from "@/lib/quickbooks";

export const maxDuration = 120;
type Context = { params: Promise<{ id: string }> };
async function loadProject(id: string) {
  const project = await db.project.findUnique({
    where: { id },
    include: {
      client: true,
      vendorBills: { orderBy: { id: "asc" } },
      invoice: true,
    },
  });
  if (!project) throw new InvoiceError("Job not found.", 404);
  const pricing = calculateProjectPricing(
    project.vendorBills,
    project.retailMultiplier,
    project.pricingPolicy,
  );
  const pricingVersion = projectPriceVersion(project);
  return { project, pricing, pricingVersion };
}
export async function GET(req: Request, { params }: Context) {
  const { error, session } = await requireAdmin();
  if (error) return error;
  try {
    const { id } = await params;
    const { project, pricing, pricingVersion } = await loadProject(id);
    let invoice = project.invoice;
    if (
      new URL(req.url).searchParams.get("refresh") === "1" &&
      invoice?.qbInvoiceId
    ) {
      const record = await db.quickBooksExport.findUnique({
        where: { id: `invoice_${invoice.id}` },
      });
      const response = await quickBooksRequest(
        `invoice/${encodeURIComponent(invoice.qbInvoiceId)}`,
        {},
        record?.realmId || project.quickBooksRealmId || undefined,
      );
      const remote = response.Invoice as {
        Balance: number;
        TotalAmt: number;
        EmailStatus?: string;
      };
      if (
        !remote ||
        !Number.isFinite(remote.Balance) ||
        !Number.isFinite(remote.TotalAmt)
      )
        throw new InvoiceError(
          "QuickBooks could not confirm the payment status.",
          502,
        );
      invoice = await db.invoice.update({
        where: { id: invoice.id },
        data: {
          amount: remote.TotalAmt,
          status:
            remote.Balance === 0
              ? "PAID"
              : remote.EmailStatus === "EmailSent"
                ? "SENT"
                : "CREATED",
          paidAt: remote.Balance === 0 ? invoice.paidAt || new Date() : null,
        },
      });
    }
    const pending = invoice
      ? await db.quickBooksExport.findUnique({
          where: { id: `invoice_${invoice.id}` },
          select: { id: true, remoteId: true, payload: true },
        })
      : null;
    const frozenDraft =
      pending && invoice?.draft
        ? customerDraftSchema.parse(invoice.draft)
        : null;
    const frozenLines = pending
      ? (pending.payload as { Line: { Amount: number; Description: string }[] })
          .Line
      : null;
    const visibleLines =
      frozenLines && frozenDraft
        ? frozenLines.map((line, index) => ({
            id: frozenDraft.lines[index].id,
            description: line.Description,
            amount: line.Amount,
            taxable: frozenDraft.lines[index].taxable,
          }))
        : pricing.customerLineItems.map((line) => ({
            id: line.id,
            description: line.description,
            amount: line.amount,
            taxable: false,
          }));
    return NextResponse.json(
      {
        canApprovePrice: canApprovePrice(session!.user.id),
        priceApproved: hasPriceApproval(project, pricingVersion),
        projectName: project.jobName || project.name,
        customerName:
          project.clientNameOverride ||
          project.client?.companyName ||
          "Choose a customer",
        customerId: project.quickBooksCustomerId || "",
        realmId: project.quickBooksRealmId,
        subtotal: frozenLines
          ? Math.round(
              frozenLines.reduce((sum, line) => sum + line.Amount, 0) * 100,
            ) / 100
          : pricing.retailPrice,
        pricingVersion: frozenDraft?.pricingVersion || pricingVersion,
        lines: visibleLines,
        draft: invoice?.draft || null,
        pending: Boolean(pending && !invoice?.qbInvoiceId),
        invoice: invoice?.qbInvoiceId
          ? {
              id: invoice.qbInvoiceId,
              amount: invoice.amount,
              status: invoice.status,
              url: quickBooksUrl("Invoice", invoice.qbInvoiceId),
            }
          : null,
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
    const body = await req.json();
    if (!["draft", "approve", "create"].includes(body.action))
      throw new InvoiceError("Choose save draft, approve price, or create invoice.");
    const { project, pricing, pricingVersion } = await loadProject(id);
    if (project.status === "CANCELLED")
      throw new InvoiceError("Reopen the job before creating an invoice.", 409);
    if (project.invoice?.qbInvoiceId)
      return NextResponse.json({
        success: true,
        url: quickBooksUrl("Invoice", project.invoice.qbInvoiceId),
        existing: true,
      });
    const previous = project.invoice
      ? await db.quickBooksExport.findUnique({
          where: { id: `invoice_${project.invoice.id}` },
        })
      : null;
    if (previous && body.action !== "create")
      throw new InvoiceError(
        "A QuickBooks submission is pending. Retry it before editing the draft.",
        409,
      );
    if (previous) {
      const result = await exportToQuickBooks(
        previous.id,
        "Invoice",
        previous.realmId,
        previous.payload as Record<string, unknown>,
      );
      await db.invoice.update({
        where: { id: project.invoice!.id },
        data: { qbInvoiceId: result.remoteId, status: "CREATED" },
      });
      return NextResponse.json({
        success: true,
        url: quickBooksUrl("Invoice", result.remoteId!),
      });
    }
    if (body.action === "approve") {
      if (!canApprovePrice(session!.user.id))
        throw new InvoiceError("Robert must review and approve the selling price.", 403);
      await db.$transaction(async (tx) => {
        if(!await isActivePriceApprover(tx,session!.user.id)) throw new InvoiceError("An active configured approver must approve the selling price.",403);
        await tx.$queryRaw`SELECT id FROM "Project" WHERE id = ${id} FOR UPDATE`;
        const current = await tx.project.findUniqueOrThrow({
          where: { id }, include: { vendorBills: true, invoice: true },
        });
        const version = projectPriceVersion(current);
        const pending = current.invoice && await tx.quickBooksExport.findUnique({
          where: { id: `invoice_${current.invoice.id}` },
        });
        if (current.status === "CANCELLED" || current.invoice?.qbInvoiceId || pending)
          throw new InvoiceError("This job cannot accept a new price approval.", 409);
        if (body.pricingVersion !== version || pricing.retailPrice <= 0)
          throw new InvoiceError("The job costs or price changed. Reopen the preview before approving.", 409);
        await tx.project.update({ where: { id }, data: {
          priceApprovedVersion: version,
          priceApprovedById: session!.user.id,
          priceApprovedAt: new Date(),
        } });
      });
      return NextResponse.json({ success: true });
    }
    if (body.action === "create" && !hasPriceApproval(project, pricingVersion))
      throw new InvoiceError("Robert must approve this version of the job price before creating an invoice.", 409);
    const draft = customerDraftSchema.parse(body.draft);
    if (draft.pricingVersion !== pricingVersion)
      throw new InvoiceError(
        "The job costs or price changed. Reopen the preview to use the latest amounts.",
        409,
      );
    if (pricing.retailPrice <= 0)
      throw new InvoiceError(
        "Add costs and set a selling price before creating an invoice.",
      );
    const lines = customerInvoiceLines(
      pricing.customerLineItems,
      draft.lines,
      draft.itemId,
    );
    if (body.action === "draft") {
      await db.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
      await tx.$queryRaw`SELECT id FROM "Project" WHERE id = ${id} FOR UPDATE`;
        const saved = await tx.invoice.findUnique({ where: { projectId: id } });
        const exported =
          saved &&
          (await tx.quickBooksExport.findUnique({
            where: { id: `invoice_${saved.id}` },
          }));
        if (saved?.qbInvoiceId || exported)
          throw new InvoiceError(
            "This invoice is already being sent to QuickBooks. Reopen it to check its status.",
            409,
          );
        await tx.invoice.upsert({
          where: { projectId: id },
          create: { projectId: id, amount: pricing.retailPrice, draft },
          update: { amount: pricing.retailPrice, draft },
        });
      });
      return NextResponse.json({ success: true });
    }
    const { realmId } = await getQuickBooksConnection();
    await assertUSQuickBooks(realmId);
    const [, item] = await Promise.all([
      quickBooksReference("Customer", draft.customerId, realmId),
      quickBooksReference("Item", draft.itemId, realmId),
    ]);
    if (!["Service", "NonInventory"].includes(item.Type || ""))
      throw new InvoiceError("Choose a service or non-inventory sales item.");
    await db.project.update({
      where: { id },
      data: {
        quickBooksCustomerId: draft.customerId,
        quickBooksRealmId: realmId,
      },
    });
    const payload = {
      CustomerRef: { value: draft.customerId },
      CurrencyRef: { value: "USD" },
      TxnDate: draft.date,
      DueDate: draft.dueDate,
      Line: lines,
      CustomerMemo: { value: project.jobName || project.name },
      EmailStatus: "NotSet",
    };
    // Freeze the local invoice and outbound payload together. A concurrent draft save
    // cannot replace descriptions or totals after submission has started.
    const invoice = await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
      await tx.$queryRaw`SELECT id FROM "Project" WHERE id = ${id} FOR UPDATE`;
      const saved = await tx.invoice.findUnique({ where: { projectId: id } });
      const exported =
        saved &&
        (await tx.quickBooksExport.findUnique({
          where: { id: `invoice_${saved.id}` },
        }));
      if (saved?.qbInvoiceId || exported) return saved!;
      const current = await tx.project.findUniqueOrThrow({
        where: { id },
        include: { vendorBills: { orderBy: { id: "asc" } } },
      });
      const version = projectPriceVersion(current);
      if (version !== pricingVersion || !hasPriceApproval(current, version) || !await isActivePriceApprover(tx,current.priceApprovedById) || current.status === "CANCELLED")
        throw new InvoiceError(
          "The job price changed during review. Reopen the preview.",
          409,
        );
      const frozen = await tx.invoice.upsert({
        where: { projectId: id },
        create: { projectId: id, amount: pricing.retailPrice, draft },
        update: { amount: pricing.retailPrice, draft },
      });
      const exportId = `invoice_${frozen.id}`;
      await tx.quickBooksExport.create({
        data: {
          id: exportId,
          realmId,
          entity: "Invoice",
          payload: { ...payload, PrivateNote: `TalentEarth:${exportId}` },
        },
      });
      return frozen;
    });
    if (invoice.qbInvoiceId)
      return NextResponse.json({
        success: true,
        url: quickBooksUrl("Invoice", invoice.qbInvoiceId),
        existing: true,
      });
    const frozen = await db.quickBooksExport.findUniqueOrThrow({
      where: { id: `invoice_${invoice.id}` },
    });
    const result = await exportToQuickBooks(
      frozen.id,
      "Invoice",
      realmId,
      frozen.payload as Record<string, unknown>,
    );
    await db.invoice.update({
      where: { id: invoice.id },
      data: { qbInvoiceId: result.remoteId, status: "CREATED" },
    });
    await saveQuickBooksDefaults({ itemId: draft.itemId });
    return NextResponse.json({
      success: true,
      url: quickBooksUrl("Invoice", result.remoteId!),
    });
  } catch (error) {
    return invoiceError(error);
  }
}
