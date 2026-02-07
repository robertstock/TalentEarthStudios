import TeamsFilter from "@/components/TeamsFilter";
import Link from "next/link";
// // import { db as prisma } from "@/lib/db";
import { MOCK_TEAMS } from "@/lib/mock-data";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Teams | TalentEarthStudios",
    description: "Operational units.",
};

interface PageProps {
    searchParams: {
        type?: string;
    }
}

export default async function TeamsPage({ searchParams }: PageProps) {
    const { type } = await searchParams;

    let teams = MOCK_TEAMS;

    if (type) {
        teams = teams.filter(t => t.type === type);
    }

    return (
        <div className="relative z-10 w-full min-h-screen pt-20 md:pt-24 pb-12">
            <div className="max-w-[1600px] mx-auto px-4 md:px-6 relative z-10 h-full flex flex-col md:flex-row gap-6 md:gap-8">

                <aside className="w-full md:w-64 flex-shrink-0 pt-0 md:pt-4">
                    <div className="md:sticky md:top-32 space-y-8 select-none">
                        <h2 className="text-xl font-light text-white md:hidden mb-4">Operational Units</h2>
                        <TeamsFilter />
                    </div>
                </aside>

                <div className="flex-1">
                    <div className="hidden md:flex justify-between items-end mb-8 border-b border-slate-800 pb-4">
                        <h2 className="text-2xl font-light text-white">Operational Units</h2>
                        <span className="text-xs font-mono text-slate-500">SHOWING {teams.length} TEAMS</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20 md:pb-0">
                        {teams.map((team) => (
                            <Link href={`/teams/${team.slug}`} key={team.id} className="block group">
                                <article className="bg-wme-panel border border-wme-border p-6 hover:border-slate-600 transition-all duration-300 cursor-pointer h-full">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex -space-x-2">
                                            {team.members.slice(0, 4).map((member: any, i) => (
                                                <div key={i} className="w-8 h-8 rounded-full border border-wme-panel overflow-hidden bg-slate-800 relative">
                                                    {/* Ideally we use Next/Image but simple img tag is safer related to domains config */}
                                                    {member?.profile?.profileImage && (
                                                        <img
                                                            src={member.profile.profileImage}
                                                            alt={member.lastName}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                            {team.members.length > 4 && (
                                                <div className="w-8 h-8 rounded-full bg-slate-800 border border-wme-panel flex items-center justify-center text-[10px] text-white font-medium">
                                                    +{team.members.length - 4}
                                                </div>
                                            )}
                                        </div>
                                        <span className={`text-[10px] uppercase tracking-wider px-2 py-1 border ${team.status === 'Available' ? 'text-green-900 bg-green-900/20 border-green-900/30' : 'text-slate-400 bg-slate-800/50 border-slate-700'}`}>{team.status}</span>
                                    </div>
                                    <h3 className="text-white font-medium text-xl mb-1 group-hover:text-blue-200 transition-colors">{team.name}</h3>
                                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-6">Operational Unit</p>
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-wme-base p-3 border border-wme-border">
                                            <span className="block text-[10px] text-slate-600 font-mono mb-1">MEMBERS</span>
                                            <span className="text-sm text-slate-300">{team.members.length} Nodes</span>
                                        </div>
                                        <div className="bg-wme-base p-3 border border-wme-border">
                                            <span className="block text-[10px] text-slate-600 font-mono mb-1">FOCUS</span>
                                            <span className="text-sm text-slate-300">{team.type}</span>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                                        <span className="text-[10px] text-slate-600 font-mono">ID: {team.id.slice(-4).toUpperCase()}</span>
                                        <span className="text-xs text-white border-b border-transparent group-hover:border-white transition-all">View Manifest</span>
                                    </div>
                                </article>
                            </Link>
                        ))}

                        {teams.length === 0 && (
                            <div className="col-span-full text-center py-20 text-slate-500 font-light">
                                No operational units found.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
