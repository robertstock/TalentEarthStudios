import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Teams | TalentEarth",
  description: "Meet the TalentEarth teams.",
};

export default async function TeamsPage() {
  const session = await getServerSession(authOptions);
  if (!(await canAccessAdmin(session)))
    redirect("/auth/signin?callbackUrl=%2Fteams");
  const teams = await db.team.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      leader: { select: { firstName: true, lastName: true } },
      _count: { select: { members: { where: { status: "ACTIVE" } } } },
    },
    orderBy: { name: "asc" },
  });
  return (
    <main className="container mx-auto min-h-screen px-6 pb-16 pt-32 text-white">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="mt-2 text-gray-400">Meet the people behind the work.</p>
        </div>
        <Link
          href="/admin/teams"
          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500"
        >
          Manage Teams
        </Link>
      </div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Link
            key={team.id}
            href={`/teams/${team.slug}`}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-blue-400/50"
          >
            <p className="mb-4 text-xs uppercase tracking-widest text-blue-300">
              {team._count.members}{" "}
              {team._count.members === 1 ? "member" : "members"}
            </p>
            <h2 className="text-xl font-bold">{team.name}</h2>
            <p className="mt-2 text-sm text-gray-500">
              Led by {team.leader.firstName} {team.leader.lastName}
            </p>
            <p className="my-5 whitespace-pre-wrap break-words text-sm text-gray-400">
              {team.description ||
                "Explore this team's roster and selected work."}
            </p>
            <span className="text-sm text-blue-300">View Team Profile →</span>
          </Link>
        ))}
      </div>
      {teams.length === 0 && (
        <p className="rounded-xl border border-dashed border-white/10 p-12 text-center text-gray-400">
          No teams yet.{" "}
          <Link href="/admin/teams" className="text-blue-300 underline">
            Create your first team
          </Link>
          .
        </p>
      )}
    </main>
  );
}
