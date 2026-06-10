"use client";

import { notFound, useParams } from "next/navigation";
import { specialtyData, SpecialtySlug } from "@/lib/specialty-data";
import Link from "next/link";

export default function SpecialtyDetail() {
    const params = useParams();
    const slug = params.slug as string;

    const data = specialtyData[slug as SpecialtySlug];

    if (!data) {
        notFound();
    }

    return (
        <div className="relative w-full min-h-screen pt-32 pb-20 px-6 md:px-16 lg:px-24 flex items-center justify-center">
            <div className="max-w-4xl w-full z-10">
                <div className="mb-12">
                    <Link href="/specialty" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm uppercase tracking-widest font-medium group">
                        <i className="ph ph-arrow-left group-hover:-translate-x-1 transition-transform"></i>
                        Back to Specialty Teams
                    </Link>
                </div>

                <div className="bg-wme-panel border border-wme-border rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden backdrop-blur-sm">
                    {/* Background glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/10 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
                    
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10 mb-8 relative z-10">
                        <div className="w-24 h-24 rounded-2xl bg-slate-800/50 border border-brand-blue/30 flex items-center justify-center shadow-[0_0_30px_rgba(0,174,239,0.15)] shrink-0">
                            <i className={`ph ${data.icon} text-5xl text-brand-blue`}></i>
                        </div>
                        
                        <div>
                            <span className="text-brand-green text-xs md:text-sm font-semibold tracking-[0.2em] uppercase mb-2 block">
                                Team Leader: {data.leaderName}
                            </span>
                            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                                {data.title}
                            </h1>
                        </div>
                    </div>

                    <div className="w-full h-px bg-gradient-to-r from-slate-700 via-slate-700/50 to-transparent mb-8"></div>

                    <div className="prose prose-invert prose-lg max-w-none mb-12 relative z-10">
                        <p className="text-slate-300 font-light leading-relaxed text-lg">
                            {data.bio}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-start gap-4 relative z-10">
                        <Link 
                            href={`/request?team=${slug}`} 
                            className="bg-brand-blue hover:bg-brand-blue/90 text-white px-8 py-4 rounded-md font-semibold tracking-widest uppercase text-sm transition-all shadow-[0_0_20px_rgba(0,174,239,0.3)] hover:shadow-[0_0_30px_rgba(0,174,239,0.5)] flex items-center justify-center gap-3"
                        >
                            Start Your Project
                            <i className="ph ph-arrow-right"></i>
                        </Link>

                        {data.mediaFiles && data.mediaFiles.length > 0 && (
                            <Link 
                                href={`/specialty/${slug}/portfolio`} 
                                className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 px-8 py-4 rounded-md font-semibold tracking-widest uppercase text-sm transition-all flex items-center justify-center gap-3"
                            >
                                View Sample Work
                                <i className="ph ph-film-strip"></i>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
