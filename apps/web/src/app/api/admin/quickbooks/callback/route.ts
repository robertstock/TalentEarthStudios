import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import {
  exchangeQuickBooksToken,
  quickBooksEnvironment,
} from "@/lib/quickbooks";

export async function GET(req: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;
  const target = new URL(
    "/admin/projects",
    process.env.NEXTAUTH_URL || req.url,
  );
  try {
    const saved = JSON.parse(req.cookies.get("qbo-oauth-state")?.value || "{}");
    if (
      !saved.nonce ||
      saved.nonce !== req.nextUrl.searchParams.get("state") ||
      saved.userId !== session!.user.id
    )
      throw new Error("Invalid state");
    if (saved.projectId) target.searchParams.set("project", saved.projectId);
    const realmId = req.nextUrl.searchParams.get("realmId");
    const code = req.nextUrl.searchParams.get("code");
    if (!code || !realmId || !/^\d+$/.test(realmId))
      throw new Error("Connection cancelled");
    const existing = await db.quickBooksConnection.findUnique({
      where: { id: "company" },
      select: { realmId: true },
    });
    // Existing exports are company-specific. Do not silently switch the accounting company.
    if (existing && existing.realmId !== realmId)
      throw new Error("Different company");
    const tokens = await exchangeQuickBooksToken(
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.QUICKBOOKS_REDIRECT_URI!,
      }),
    );
    const data = { realmId, environment: quickBooksEnvironment(), ...tokens };
    await db.quickBooksConnection.upsert({
      where: { id: "company" },
      create: { id: "company", ...data },
      update: data,
    });
    target.searchParams.set("quickbooks", "connected");
  } catch {
    target.searchParams.set("quickbooks", "connection-failed");
  }
  const response = NextResponse.redirect(target);
  response.cookies.set("qbo-oauth-state", "", {
    maxAge: 0,
    path: "/api/admin/quickbooks/callback",
  });
  return response;
}
