import { randomUUID } from "node:crypto";
import { Resend } from "resend";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  CODE_TTL_MS,
  hashCode,
  newCode,
  normalizeMobileEmail,
} from "@/lib/mobile-security";
import {
  limitMobileRequests,
  mobileClientIp,
  mobileJson,
  mobileOptions,
  mobileRoute,
  mobileSecret,
  MobileError,
} from "@/lib/mobile-api";

export const OPTIONS = mobileOptions;
export async function POST(req: Request) {
  return mobileRoute(req, async () => {
    const input = z
      .object({
        email: z.string().trim().email().max(254),
        name: z.string().trim().max(100).optional(),
      })
      .parse(await mobileJson(req, 2048));
    const email = normalizeMobileEmail(input.email);
    const secret = mobileSecret();
    if (!process.env.RESEND_API_KEY)
      throw new MobileError(
        "Email sign-in is not configured yet. Please try again later.",
        503,
      );
    await limitMobileRequests("code-ip", mobileClientIp(req), 20, 3_600_000);
    await limitMobileRequests("code-minute", email, 1, 60_000);
    await limitMobileRequests("code-hour", email, 5, 3_600_000);
    const existing = await db.mobileAccount.findUnique({ where: { email } });
    const name = existing?.name || input.name;
    if (!name) throw new MobileError("Enter your name to create your account.");
    const id = randomUUID();
    const code = newCode();
    await db.$transaction([
      db.mobileChallenge.deleteMany({ where: { email } }),
      db.mobileChallenge.create({
        data: {
          id,
          email,
          name,
          codeHash: hashCode(id, code, secret),
          expiresAt: new Date(Date.now() + CODE_TTL_MS),
        },
      }),
    ]);
    try {
      const { error } = await new Resend(
        process.env.RESEND_API_KEY,
      ).emails.send({
        from:
          process.env.MOBILE_AUTH_FROM_EMAIL ||
          process.env.PROJECT_REQUEST_FROM_EMAIL ||
          "Finley by TalentEarth Studios <no-reply@talentearth.com>",
        to: email,
        subject: "Your Finley sign-in code",
        text: `Your Finley code is ${code}. Finley helps you submit creative projects to TalentEarth Studios. This code expires in 10 minutes. Never share it. If you didn't request it, you can ignore this email.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;padding:32px"><h1>Welcome to Finley</h1><p>Your creative project assistant for TalentEarth Studios.</p><p>Enter this code to verify your email and sign in.</p><p style="font-size:36px;letter-spacing:8px;font-weight:bold">${code}</p><p>This code expires in 10 minutes. Never share it.</p><p>If you didn't request this, you can ignore this email.</p></div>`,
      });
      if (error) throw new Error("Email delivery failed");
    } catch {
      await db.mobileChallenge.deleteMany({ where: { id } });
      throw new MobileError(
        "We couldn't send your code. Please wait a minute and try again.",
        503,
      );
    }
    return { challengeId: id, expiresIn: CODE_TTL_MS / 1000, resendAfter: 60 };
  });
}
