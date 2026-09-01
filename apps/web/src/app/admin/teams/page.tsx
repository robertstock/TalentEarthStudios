import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminTeamsPage() {
    const session = await getServerSession(authOptions);

    if (!(await canAccessAdmin(session))) {
        redirect("/app");
    }

    const teams = await db.team.findMany({
        include: {
            leader: true,
            members: {
                include: { user: true },
                orderBy: { user: { lastName: "asc" } }
            },
            _count: {
                select: { projects: true }
            }
        },
        orderBy: { name: "asc" }
    });

    return (
        <div className="container mx-auto min-h-screen px-6 pb-12 pt-32 text-white">
            <Link href="/admin" className="mb-5 flex w-fit items-center gap-2 text-sm text-gray-400 transition hover:text-white">
                <i className="ph ph-arrow-left"></i>
                Back to Dashboard
            </Link>

            <div className="mb-10 border-b border-white/10 pb-7">
                <h1 className="text-3xl font-bold">Team Management</h1>
                <p className="mt-2 text-sm text-gray-400">Live team membership and project assignments from the production database.</p>
            </div>

            {teams.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {teams.map((team) => (
                        <section key={team.id} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                            <div className="mb-5 flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white">{team.name}</h2>
                                    <p className="mt-1 text-sm text-gray-500">Led by {team.leader.firstName} {team.leader.lastName}</p>
                                </div>
                                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                                    {team.status}
                                </span>
                            </div>

                            <div className="mb-5 grid grid-cols-2 gap-3">
                                <div className="rounded-lg border border-white/5 bg-black/20 p-3">
                                    <div className="text-[10px] uppercase tracking-widest text-gray-500">Members</div>
                                    <div className="mt-1 text-2xl text-white">{team.members.length}</div>
                                </div>
                                <div className="rounded-lg border border-white/5 bg-black/20 p-3">
                                    <div className="text-[10px] uppercase tracking-widest text-gray-500">Projects</div>
                                    <div className="mt-1 text-2xl text-white">{team._count.projects}</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {team.members.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-4 py-3 text-sm">
                                        <span className="text-gray-200">{member.user.firstName} {member.user.lastName}</span>
                                        <span className="text-xs text-gray-500">{member.roleInTeam || "Member"}</span>
                                    </div>
                                ))}
                                {team.members.length === 0 && (
                                    <p className="rounded-lg border border-dashed border-white/10 px-4 py-5 text-center text-sm text-gray-500">No members assigned.</p>
                                )}
                            </div>
                        </section>
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-12 text-center text-gray-500">
                    No teams have been created yet.
                </div>
            )}
        </div>
    );
}
