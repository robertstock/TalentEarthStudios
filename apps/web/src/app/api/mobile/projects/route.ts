import { Prisma } from "@prisma/client";
import { after } from "next/server";
import { db } from "@/lib/db";
import { mobileProjectData, mobileProjectInput } from "@/lib/mobile-projects";
import { deliverMobileNotification } from "@/lib/mobile-notifications";
import {
  limitMobileRequests,
  mobileJson,
  mobileOptions,
  mobileRoute,
  requireMobileAccount,
  MobileError,
} from "@/lib/mobile-api";

export const OPTIONS = mobileOptions;
export const POST = (req: Request) =>
  mobileRoute(req, async () => {
    const { account } = await requireMobileAccount(req);
    const input = mobileProjectInput.parse(await mobileJson(req));
    const existing = await db.mobileSubmission.findUnique({
      where: { id: input.submissionId },
    });
    if (existing) {
      if (existing.accountId !== account.id)
        throw new MobileError("Please start a new project.", 409);
      after(() => deliverMobileNotification(existing.id).then(() => {}));
      return { projectId: existing.projectId, submitted: true };
    }
    await limitMobileRequests("project-submit", account.id, 20, 3_600_000);
    const administrator = await db.user.findFirst({
      where: { role: "ADMIN", status: "APPROVED" },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    if (!administrator)
      throw new MobileError(
        "Project intake is temporarily unavailable. Your draft is still here.",
        503,
      );
    let projectId: string;
    try {
      projectId = await db.$transaction(async (tx) => {
        const client =
          (await tx.client.findFirst({
            where: { email: account.email },
            orderBy: { createdAt: "asc" },
          })) ||
          (await tx.client.create({
            data: {
              companyName: account.name,
              primaryContactName: account.name,
              email: account.email,
            },
          }));
        const project = await tx.project.create({
          data: mobileProjectData(input, client.id, administrator.id),
        });
        await tx.mobileSubmission.create({
          data: {
            id: input.submissionId,
            accountId: account.id,
            projectId: project.id,
          },
        });
        return project.id;
      });
    } catch (error) {
      // An uncertain network retry or simultaneous tap must never create two projects.
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2002"
      )
        throw error;
      const duplicate = await db.mobileSubmission.findUnique({
        where: { id: input.submissionId },
      });
      if (!duplicate || duplicate.accountId !== account.id)
        throw new MobileError("Please start a new project.", 409);
      projectId = duplicate.projectId;
    }
    // The outbox record is committed with the project. Mail failures cannot lose the project.
    after(() => deliverMobileNotification(input.submissionId).then(() => {}));
    return { projectId, submitted: true };
  });
