import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { deliverMobileNotification } from "@/lib/mobile-notifications";

export const maxDuration = 60;
export async function GET(req: Request) {
  const expected = `Bearer ${process.env.CRON_SECRET || ""}`;
  const received = req.headers.get("authorization") || "";
  if (
    !process.env.CRON_SECRET ||
    received.length !== expected.length ||
    !timingSafeEqual(Buffer.from(received), Buffer.from(expected))
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const pending = await db.mobileSubmission.findMany({
    where: { notificationSentAt: null },
    take: 25,
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  const results = await Promise.allSettled(
    pending.map((item) => deliverMobileNotification(item.id)),
  );
  await db.$transaction([
    db.mobileChallenge.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
    db.mobileSession.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
    db.mobileRateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
  ]);
  return NextResponse.json({
    processed: pending.length,
    sent: results.filter((item) => item.status === "fulfilled" && item.value)
      .length,
  });
}
