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
    } | null;
}

interface TalentIndexProps {
    initialTalents: Talent[];
}

export default function TalentIndex({ initialTalents }: TalentIndexProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredTalents = useMemo(() => {
        const lowerQuery = searchQuery.toLowerCase().trim();
        if (!lowerQuery) return initialTalents;

        return initialTalents.filter((t) => {
            const name = `${t.firstName} ${t.lastName}`.toLowerCase();
            const headline = (t.profile?.headline || "").toLowerCase();
            const skills = (t.profile?.skills || []).join(" ").toLowerCase();

            // Check if any field contains the query
            return name.includes(lowerQuery) ||
                headline.includes(lowerQuery) ||
                skills.includes(lowerQuery);
        });
    }, [initialTalents, searchQuery]);

    return (
        <div className="flex-1">
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-slate-800 pb-4">
                <h2 className="text-2xl font-light text-white">Talent Index</h2>
                <span className="text-xs font-mono text-slate-500">SHOWING {filteredTalents.length} UNITS</span>
            </div>

            {/* Mobile Search (in case sidebar hidden) */}
            <div className="md:hidden mb-6">
                <input
                    type="text"
                    placeholder="Search talent..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 p-3 rounded text-white"
                />
            </div>

            {/* Desktop Search Portal - We use a portal or just state lifting usually, but for now we can rely on this component rendering the grid. 
               The Sidebar search input needs to talk to this. 
               For now, I'll put a Search Input HERE in the main area if the sidebar one isn't connected, 
               OR we assume the user types in the sidebar which passes props.
               
               Actually, to match the layout perfect, the Sidebar is likely 'fixed' or separate. 
               Let's render the Search Input inside this component but visually place it where it makes sense, 
               or accept that for now the search bar is up top. 
               
               better yet: Let's render the search bar here as part of the "system" panel if we can't easily lift state up to the page level without losing server components benefits.
            */}



            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pb-20 md:pb-0">
                {filteredTalents.map((talent) => (
                    <Link href={`/talent/${talent.id}`} key={talent.id} className="block group">
                        <article className="bg-wme-panel border border-wme-border p-5 hover:border-slate-600 transition-all duration-300 cursor-pointer overflow-hidden h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-16 h-16 bg-slate-800 overflow-hidden border border-wme-border relative">
                                    {talent.profile?.profileImage ? (
                                        <Image
                                            src={talent.profile.profileImage}
                                            alt={`${talent.firstName} ${talent.lastName}`}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-700 flex items-center justify-center text-xs text-slate-500 font-medium">
                                            {talent.firstName[0]}{talent.lastName[0]}
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] uppercase tracking-wider text-green-900 bg-green-900/20 px-2 py-1 border border-green-900/30">Available</span>
                            </div>
                            <h3 className="text-white font-medium text-lg mb-1 group-hover:text-blue-200 transition-colors">
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
                    <div className="col-span-full text-center py-20 text-slate-500 font-light">
                        No active units found matching "{searchQuery}".
                    </div>
                )}
            </div>

            {/* Hidden portal logic for sidebar search connection could go here if using context, but keeping it simple first. */}
            {/* Let's inject the search input logic via a React Portal or just ensuring the structure allows the search bar to govern this list.
                Since the sidebar was in the layout in the previous file, I will need to coordinate them in the main page file.
            */}
        </div>
    );
}
