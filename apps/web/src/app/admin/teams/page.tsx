import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import TeamManagementClient from "./TeamManagementClient";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage() {
  const session = await getServerSession(authOptions);
  if (!(await canAccessAdmin(session)))
    redirect("/auth/signin?callbackUrl=%2Fadmin%2Fteams");
  const [teams, users] = await Promise.all([
    db.team.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        leaderUserId: true,
        status: true,
        members: {
          where: { status: "ACTIVE" },
          select: { userId: true, roleInTeam: true },
        },
        _count: { select: { projects: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
  ]);
  return (
    <TeamManagementClient
      teams={teams.map((team) => ({
        ...team,
        projectCount: team._count.projects,
      }))}
      users={users}
    />
  );
}
