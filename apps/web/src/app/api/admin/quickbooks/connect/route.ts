import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import {
  InvoiceError,
  invoiceError,
  requireSameOrigin,
} from "@/lib/invoice-api";
import { quickBooksConfigured } from "@/lib/quickbooks";

export async function POST(req: Request) {
  const { error, session } = await requireAdmin();
  if (error) return error;
  try {
    requireSameOrigin(req);
    if (!quickBooksConfigured())
      throw new InvoiceError(
        "QuickBooks needs one-time setup by your website administrator.",
        503,
      );
    const { projectId } = await req.json();
    const nonce = randomBytes(32).toString("hex");
    const url = new URL("https://appcenter.intuit.com/connect/oauth2");
    url.search = new URLSearchParams({
      client_id: process.env.QUICKBOOKS_CLIENT_ID!,
      redirect_uri: process.env.QUICKBOOKS_REDIRECT_URI!,
      response_type: "code",
      scope: "com.intuit.quickbooks.accounting",
      state: nonce,
    }).toString();
    const response = NextResponse.json({ url: url.toString() });
    response.cookies.set(
      "qbo-oauth-state",
      JSON.stringify({
        nonce,
        userId: session!.user.id,
        projectId: typeof projectId === "string" ? projectId.slice(0, 100) : "",
      }),
      {
        httpOnly: true,
        secure: new URL(req.url).protocol === "https:",
        sameSite: "lax",
        path: "/api/admin/quickbooks/callback",
        maxAge: 600,
      },
    );
    return response;
  } catch (error) {
    return invoiceError(error);
  }
}
