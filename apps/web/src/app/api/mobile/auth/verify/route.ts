import { z } from "zod";
import { db } from "@/lib/db";
import {
  hashToken,
  matchesCode,
  MAX_CODE_ATTEMPTS,
  newSessionToken,
  SESSION_TTL_MS,
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
    const { challengeId, code } = z
      .object({
        challengeId: z.string().uuid(),
        code: z.string().regex(/^\d{6}$/),
      })
      .parse(await mobileJson(req, 2048));
    await limitMobileRequests("verify-ip", mobileClientIp(req), 40, 3_600_000);
    const attempt = await db.mobileChallenge.updateMany({
      where: {
        id: challengeId,
        expiresAt: { gt: new Date() },
        attempts: { lt: MAX_CODE_ATTEMPTS },
      },
      data: { attempts: { increment: 1 } },
    });
    const invalid = () =>
      new MobileError(
        "That code is incorrect, expired, or already used. Request a new code if needed.",
      );
    if (!attempt.count) throw invalid();
    const challenge = await db.mobileChallenge.findUnique({
      where: { id: challengeId },
    });
    if (
      !challenge ||
      !matchesCode(challengeId, code, challenge.codeHash, mobileSecret())
    )
      throw invalid();
    const token = newSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const account = await db.$transaction(async (tx) => {
      // Consumption and session creation are atomic; a code can create only one session.
      const consumed = await tx.mobileChallenge.deleteMany({
        where: { id: challengeId, expiresAt: { gt: new Date() } },
      });
      if (!consumed.count) throw invalid();
      const account = await tx.mobileAccount.upsert({
        where: { email: challenge.email },
        update: {},
        create: { email: challenge.email, name: challenge.name },
      });
      await tx.mobileSession.create({
        data: { tokenHash: hashToken(token), accountId: account.id, expiresAt },
      });
      return account;
    });
    return {
      token,
      expiresAt,
      account: { id: account.id, name: account.name, email: account.email },
    };
  });
}
