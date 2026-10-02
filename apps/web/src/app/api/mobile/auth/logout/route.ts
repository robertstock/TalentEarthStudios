import { db } from "@/lib/db";
import {
  mobileOptions,
  mobileRoute,
  requireMobileAccount,
} from "@/lib/mobile-api";
export const OPTIONS = mobileOptions;
export const POST = (req: Request) =>
  mobileRoute(req, async () => {
    const { tokenHash } = await requireMobileAccount(req);
    await db.mobileSession.deleteMany({ where: { tokenHash } });
    return { success: true };
  });
