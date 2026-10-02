import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { db } from "@/lib/db";
import { hashToken, rateLimitKey } from "@/lib/mobile-security";

export class MobileError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function mobileSecret() {
  const secret = process.env.MOBILE_AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret)
    throw new MobileError(
      "Sign-in is not configured yet. Please try again later.",
      503,
    );
  return secret;
}

export async function requireMobileAccount(req: Request) {
  const token = req.headers
    .get("authorization")
    ?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!token) throw new MobileError("Please sign in to continue.", 401);
  const session = await db.mobileSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { account: true },
  });
  if (!session || session.expiresAt <= new Date())
    throw new MobileError("Please sign in again.", 401);
  return { account: session.account, tokenHash: session.tokenHash };
}

export async function limitMobileRequests(
  scope: string,
  identity: string,
  limit: number,
  windowMs: number,
) {
  const bucket = rateLimitKey(scope, identity, windowMs);
  // Atomic database counters work across serverless instances, unlike an in-memory map.
  const result = await db.mobileRateLimit.upsert({
    where: { key: bucket.key },
    create: bucket,
    update: { count: { increment: 1 } },
  });
  if (result.count > limit)
    throw new MobileError(
      "Too many attempts. Please wait before trying again.",
      429,
    );
}

export function mobileClientIp(req: Request) {
  // Vercel overwrites x-vercel-forwarded-for; do not trust a client-supplied XFF there.
  return (
    req.headers.get(
      process.env.VERCEL ? "x-vercel-forwarded-for" : "x-forwarded-for",
    ) || "local"
  )
    .split(",")[0]
    .trim();
}

export async function readLimitedBody(req: Request, limit: number) {
  if (Number(req.headers.get("content-length")) > limit)
    throw new MobileError("This recording or request is too large.", 413);
  const reader = req.body?.getReader();
  if (!reader) throw new MobileError("The request is empty.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new MobileError("This recording or request is too large.", 413);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export async function mobileJson(req: Request, limit = 100_000) {
  try {
    return JSON.parse((await readLimitedBody(req, limit)).toString("utf8"));
  } catch (error) {
    if (error instanceof MobileError) throw error;
    throw new MobileError("Please check the submitted details.");
  }
}

export async function mobileRoute(
  req: Request,
  handler: () => Promise<unknown>,
) {
  const origin = req.headers.get("origin");
  const allowed = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
    ...(process.env.MOBILE_WEB_ORIGINS || "").split(","),
  ].filter(Boolean);
  const headers: Record<string, string> = {
    "Cache-Control": "no-store",
    Vary: "Origin",
  };
  if (
    origin &&
    origin !== new URL(req.url).origin &&
    !allowed.includes(origin)
  ) {
    return NextResponse.json(
      { error: "This origin is not allowed." },
      { status: 403, headers },
    );
  }
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type";
  headers["Access-Control-Allow-Methods"] = "GET, POST, DELETE, OPTIONS";
  if (req.method === "OPTIONS")
    return new NextResponse(null, { status: 204, headers });
  try {
    return NextResponse.json(await handler(), { headers });
  } catch (error) {
    if (error instanceof MobileError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status, headers },
      );
    if (error instanceof ZodError)
      return NextResponse.json(
        { error: "Please check the submitted details." },
        { status: 400, headers },
      );
    console.error(
      "Mobile request failed",
      error instanceof Error ? error.name : "Unknown error",
    );
    return NextResponse.json(
      {
        error:
          "Something went wrong. Your draft is still here; please try again.",
      },
      { status: 500, headers },
    );
  }
}

export const mobileOptions = (req: Request) =>
  mobileRoute(req, async () => ({}));
