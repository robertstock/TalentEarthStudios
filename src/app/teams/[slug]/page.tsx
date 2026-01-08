
import { MOCK_TEAMS } from "@/lib/mock-data";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
    params: {
        slug: string;
    }
}

export async function generateMetadata({ params }: PageProps) {
    const { slug } = await params;
    const team = MOCK_TEAMS.find((t) => t.slug === slug);
    if (!team) return { title: "Team Not Found" };
    return {
        title: `${team.name} | Operational Unit`,
        description: team.description,
    };
}

export default async function TeamManifestPage({ params }: PageProps) {
    const { slug } = await params;
    const team = MOCK_TEAMS.find((t) => t.slug === slug);

    if (!team) {
        notFound();
    }

    return (
        <div className="relative z-10 w-full min-h-screen pt-24 pb-20">
            <div className="max-w-[1600px] mx-auto px-6">

                {/* Header */}
                <div className="mb-12 border-b border-slate-800 pb-8 flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">Operational Unit {team.id.slice(-4)}</span>
                            <span className={`text-[10px] uppercase tracking-wider px-2 py-1 border ${team.status === 'Available' ? 'text-green-900 bg-green-900/20 border-green-900/30' : 'text-slate-400 bg-slate-800/50 border-slate-700'}`}>{team.status}</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-light text-white mb-4">{team.name}</h1>
                        <p className="text-xl text-slate-400 font-light max-w-2xl">{team.description}</p>
                    </div>
                    <Link href="/teams" className="hidden md:block text-xs font-mono text-slate-500 hover:text-white transition-colors">
                        ← BACK TO UNITS
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Main Content: Manifest / Portfolio */}
                    <div className="lg:col-span-8">
                        <section>
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 border-b border-slate-800 pb-2">Manifest / Selected Works</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {team.portfolio && team.portfolio.map((item: any) => (
                                    <div key={item.id} className="group cursor-pointer">
                                        <div className="aspect-video bg-slate-900 overflow-hidden border border-slate-800 group-hover:border-slate-600 transition-all relative">
                                            {/* We use standard img for simplicity with external URLs in mock data */}
                                            <img src={item.image} alt={item.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-500 scale-100 group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                                                <span className="text-xs font-mono text-green-400 mb-1">{item.type}</span>
                                                <h4 className="text-white text-lg font-medium">{item.title}</h4>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!team.portfolio || team.portfolio.length === 0) && (
                                    <div className="col-span-full py-12 text-slate-600 font-mono text-sm border border-dashed border-slate-800 flex items-center justify-center">
                                        NO MANIFEST DATA AVAILABLE
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-16">
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 border-b border-slate-800 pb-2">Capabilities</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {/* Mock capabilities based on type */}
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="bg-slate-900/50 p-4 border border-slate-800">
                                        <div className="w-1 h-1 bg-green-500 mb-2"></div>
                                        <span className="text-sm text-slate-300">Capability {i}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar: Roster */}
                    <aside className="lg:col-span-4">
                        <div className="bg-wme-panel border border-wme-border p-6 sticky top-32">
                            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 border-b border-slate-800 pb-2">Team Roster</h3>

                            <div className="space-y-4">
                                {team.members.map((member: any) => (
                                    <div key={member.id} className="flex items-center gap-4 group cursor-pointer hover:bg-slate-800/50 p-2 rounded -mx-2 transition-colors">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-700">
                                            <img src={member.profile.profileImage} alt={member.lastName} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <div className="text-white font-medium group-hover:text-green-400 transition-colors">{member.firstName} {member.lastName}</div>
                                            <div className="text-xs text-slate-500 uppercase tracking-wide">{member.profile.primaryDiscipline || member.profile.headline}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-800">
                                <button className="w-full bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors">
                                    Book This Unit
                                </button>
                                <div className="mt-4 text-center">
                                    <span className="text-[10px] text-slate-600">ID: {team.id}</span>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>

            </div>
        </div>
    );
}
