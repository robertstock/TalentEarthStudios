"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { teamRoster, teamSchema, teamSlug } from "@/lib/team-management";

export type TeamActionResult = { status: "success" | "error"; message: string };
class TeamError extends Error {}

export async function saveTeam(input: unknown): Promise<TeamActionResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!(await canAccessAdmin(session)) || !session?.user?.id) {
      return {
        status: "error",
        message: "Please sign in with an active administrator account.",
      };
    }
    const parsed = teamSchema.safeParse(input);
    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message || "Check the team details.",
      };
    }
    const data = parsed.data;
    const roster = teamRoster(data);
    const userIds = roster.map((member) => member.userId);
    const team = await db.$transaction(
      async (transaction) => {
        const eligibleCount = await transaction.user.count({
          where: {
            id: { in: userIds },
            status: "APPROVED",
            role: { in: ["TALENT", "ADMIN"] },
          },
        });
        if (eligibleCount !== userIds.length) {
          throw new TeamError(
            "Choose approved users for the leader and members. Remove any unavailable accounts before saving.",
          );
        }
        const previous = data.id
          ? await transaction.team.findUnique({ where: { id: data.id } })
          : null;
        if (data.id && !previous)
          throw new TeamError(
            "This team no longer exists. Refresh the page and try again.",
          );
        const details = {
          name: data.name,
          description: data.description || null,
          leaderUserId: data.leaderUserId,
        };
        const saved = previous
          ? await transaction.team.update({
              where: { id: previous.id },
              data: details,
            })
          : await transaction.team.create({
              data: {
                ...details,
                slug: `${teamSlug(data.name)}-${randomUUID().slice(0, 8)}`,
              },
            });

        // Retain membership history while revoking removed members' team access.
        await transaction.teamMember.updateMany({
          where: { teamId: saved.id, userId: { notIn: userIds } },
          data: { status: "REMOVED" },
        });
        for (const member of roster) {
          await transaction.teamMember.upsert({
            where: {
              teamId_userId: { teamId: saved.id, userId: member.userId },
            },
            create: { teamId: saved.id, ...member, status: "ACTIVE" },
            update: { roleInTeam: member.roleInTeam, status: "ACTIVE" },
          });
        }
        await transaction.user.update({
          where: { id: data.leaderUserId },
          data: { isTeamLeader: true },
        });
        if (previous && previous.leaderUserId !== data.leaderUserId) {
          const remaining = await transaction.team.count({
            where: { leaderUserId: previous.leaderUserId },
          });
          await transaction.user.update({
            where: { id: previous.leaderUserId },
            data: { isTeamLeader: remaining > 0 },
          });
        }
        await transaction.auditLog.create({
          data: {
            actorUserId: session.user.id,
            action: previous ? "TEAM_UPDATED" : "TEAM_CREATED",
            entityType: "TEAM",
            entityId: saved.id,
            metadata: {
              name: saved.name,
              leaderUserId: data.leaderUserId,
              memberIds: userIds,
            },
          },
        });
        return saved;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 15000,
      },
    );
    for (const path of [
      "/admin/teams",
      "/teams",
      `/teams/${team.slug}`,
      "/admin/projects",
      "/app/requests",
    ])
      revalidatePath(path);
    return {
      status: "success",
      message: `${team.name} ${data.id ? "updated" : "created"}.`,
    };
  } catch (error) {
    if (error instanceof TeamError)
      return { status: "error", message: error.message };
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return {
        status: "error",
        message: "The team changed while you were saving. Please try again.",
      };
    }
    console.error("TEAM_SAVE_ERROR", error);
    return {
      status: "error",
      message: "The team could not be saved. Please try again.",
    };
  }
}
