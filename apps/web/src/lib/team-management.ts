import { z } from "zod";

export const teamSchema = z
  .object({
    id: z.string().min(1).optional(),
    name: z.string().trim().min(1, "Enter a team name.").max(120),
    description: z.string().trim().max(2000).default(""),
    leaderUserId: z.string().min(1, "Choose a team leader."),
    members: z
      .array(
        z.object({
          userId: z.string().min(1),
          roleInTeam: z.string().trim().max(80).default(""),
        }),
      )
      .max(100, "A team can have up to 100 members."),
  })
  .superRefine((team, context) => {
    if (
      new Set(team.members.map((member) => member.userId)).size !==
      team.members.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["members"],
        message: "Each person can only be added once.",
      });
    }
    if (
      new Set([
        team.leaderUserId,
        ...team.members.map((member) => member.userId),
      ]).size > 100
    ) {
      context.addIssue({
        code: "custom",
        path: ["members"],
        message: "A team can have up to 100 members, including the leader.",
      });
    }
  });

export type TeamInput = z.infer<typeof teamSchema>;

export function teamRoster(team: TeamInput) {
  const members = team.members.map((member) => ({
    userId: member.userId,
    roleInTeam:
      member.roleInTeam ||
      (member.userId === team.leaderUserId ? "Team Leader" : "Member"),
  }));
  if (!members.some((member) => member.userId === team.leaderUserId)) {
    members.unshift({ userId: team.leaderUserId, roleInTeam: "Team Leader" });
  }
  return members;
}

export function teamSlug(name: string) {
  return (
    name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "team"
  );
}
