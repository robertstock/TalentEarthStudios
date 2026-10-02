import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export class InvoiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
export function invoiceError(error: unknown) {
  if (error instanceof InvoiceError)
    return NextResponse.json(
      { message: error.message },
      { status: error.status },
    );
  if (error instanceof ZodError)
    return NextResponse.json(
      { message: error.issues[0]?.message || "Check the invoice details." },
      { status: 400 },
    );
  if (error instanceof SyntaxError)
    return NextResponse.json(
      { message: "Invalid invoice details." },
      { status: 400 },
    );
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  )
    return NextResponse.json(
      {
        message:
          "This invoice has already been saved. Refresh the list to review it.",
      },
      { status: 409 },
    );
  console.error(
    "INVOICE_WORKFLOW_ERROR",
    error instanceof Error ? error.name : "Unknown error",
  );
  return NextResponse.json(
    { message: "The invoice could not be saved. Please try again." },
    { status: 500 },
  );
}
export function requireSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin)
    throw new InvoiceError("This request is not allowed.", 403);
}
export async function limitedBody(req: Request, max: number) {
  if (Number(req.headers.get("content-length")) > max)
    throw new InvoiceError("Please choose a file smaller than 4 MB.", 413);
  const reader = req.body?.getReader();
  if (!reader) throw new InvoiceError("Please choose an invoice file.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > max) {
        await reader.cancel();
        throw new InvoiceError("Please choose a file smaller than 4 MB.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}
