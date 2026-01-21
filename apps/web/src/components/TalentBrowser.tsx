"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";

interface Talent {
    id: string;
    firstName: string;
    lastName: string;
    profile: {
        headline: string | null;
        profileImage: string | null;
        skills: string[];
        publicSlug: string | null;
    } | null;
}

interface TalentBrowserProps {
    initialTalents: Talent[];
}

export default function TalentBrowser({ initialTalents }: TalentBrowserProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredTalents = useMemo(() => {
        const lowerQuery = searchQuery.toLowerCase().trim();
        if (!lowerQuery) return initialTalents;

        return initialTalents.filter((t) => {
            const name = `${t.firstName} ${t.lastName}`.toLowerCase();
            const headline = (t.profile?.headline || "").toLowerCase();
            const skills = (t.profile?.skills || []).join(" ").toLowerCase();

            return name.includes(lowerQuery) ||
                headline.includes(lowerQuery) ||
                skills.includes(lowerQuery);
        });
    }, [initialTalents, searchQuery]);

    return (
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 relative z-10 h-full flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Sidebar */}
            <aside className="w-full md:w-64 flex-shrink-0 pt-0 md:pt-4">
                <div className="md:sticky md:top-32 select-none">
                    <div className="flex justify-between items-center md:block mb-4 md:mb-0">
                        <h2 className="text-xl md:text-2xl font-light text-white md:hidden">Talent Index</h2>
                        <button className="md:hidden flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400 border border-slate-800 px-3 py-2 bg-wme-panel">
                            <i className="ph ph-sliders"></i> Filter
                        </button>
                    </div>

                    <div className="hidden md:block bg-wme-panel md:bg-transparent p-4 md:p-0 border border-wme-border md:border-none mb-6 md:mb-0">
                        <div>
                            <h4 className="hidden md:block text-xs font-bold text-white uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">Index</h4>
                            <div className="mb-6">
                                <label className="text-[10px] font-mono text-slate-600 block mb-2">SEARCH</label>
                                <div className="flex items-center gap-2 border border-slate-800 bg-wme-base md:bg-wme-panel px-3 py-3 md:py-2">
                                    <input
                                        type="text"
                                        placeholder="Name, role..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-transparent outline-none text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none"
                                        autoFocus
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="pt-8 mt-8 border-t border-slate-800 hidden md:block">
                            <div className="text-[10px] text-slate-600 font-mono">SYSTEM STATUS: ONLINE<br />LATENCY: 12ms</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Content Content - Grid */}
            <div className="flex-1">
                <div className="hidden md:flex justify-between items-end mb-8 border-b border-slate-800 pb-4">
                    <h2 className="text-2xl font-light text-white">Talent Index</h2>
                    <span className="text-xs font-mono text-slate-500">SHOWING {filteredTalents.length} UNITS</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pb-20 md:pb-0">
                    {filteredTalents.map((talent) => (
                        <Link href={`/talent/${talent.profile?.publicSlug || talent.id}`} key={talent.id} className="block group">
                            <article className="bg-[#0e0e0e] border border-white/5 p-5 hover:border-slate-600 transition-all duration-300 cursor-pointer overflow-hidden h-full shadow-lg">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-16 h-16 bg-slate-800 overflow-hidden border border-white/10 relative">
                                        {talent.profile?.profileImage ? (
                                            <Image
                                                src={talent.profile.profileImage}
                                                alt={`${talent.firstName} ${talent.lastName}`}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-slate-900 flex items-center justify-center text-xs text-slate-500 font-medium">
                                                {talent.firstName[0]}{talent.lastName[0]}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] uppercase tracking-wider text-green-500 bg-green-900/10 px-2 py-1 border border-green-900/20">Available</span>
                                </div>
                                <h3 className="text-white font-medium text-lg mb-1 group-hover:text-blue-400 transition-colors">
                                    {talent.firstName} {talent.lastName}
                                </h3>
                                <p className="text-slate-500 text-xs uppercase tracking-wider mb-4">
                                    {talent.profile?.headline || 'Specialist'}
                                </p>

                                <div className="space-y-3 mb-6">
                                    {talent.profile?.skills && talent.profile.skills.length > 0 ? (
                                        <div className="flex items-start gap-2">
                                            <i className="ph ph-wrench text-slate-600 mt-0.5 text-xs"></i>
                                            <p className="text-sm text-slate-400 leading-tight">
                                                {talent.profile.skills.slice(0, 3).join(', ')}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-2">
                                            <i className="ph ph-wrench text-slate-600 mt-0.5 text-xs"></i>
                                            <p className="text-sm text-slate-400 leading-tight">Verified Skills</p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                                    <span className="text-[10px] text-slate-600 font-mono">ID: {talent.id.slice(-4).toUpperCase()}</span>
                                    <i className="ph ph-caret-right text-slate-600 group-hover:text-white transition-colors"></i>
                                </div>
                            </article>
                        </Link>
                    ))}

                    {filteredTalents.length === 0 && (
                        <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                            <i className="ph ph-magnifying-glass text-4xl text-slate-700 mb-4"></i>
                            <p className="text-slate-500">No units found matching "{searchQuery}".</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
