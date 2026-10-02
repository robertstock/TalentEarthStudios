import { db } from "@/lib/db";
import {
  mobileJson,
  mobileOptions,
  mobileRoute,
  requireMobileAccount,
  MobileError,
} from "@/lib/mobile-api";
export const OPTIONS = mobileOptions;
export const GET = (req: Request) =>
  mobileRoute(req, async () => {
    const { account } = await requireMobileAccount(req);
    return {
      account: { id: account.id, name: account.name, email: account.email },
    };
  });
export const DELETE = (req: Request) =>
  mobileRoute(req, async () => {
    const { account } = await requireMobileAccount(req);
    const body = await mobileJson(req, 1024);
    if (body.confirm !== "DELETE")
      throw new MobileError("Please confirm account deletion.");
    await db.$transaction([
      db.mobileChallenge.deleteMany({ where: { email: account.email } }),
      db.mobileAccount.delete({ where: { id: account.id } }),
    ]);
    return { deleted: true };
  });
