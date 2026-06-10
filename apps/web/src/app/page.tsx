import Link from "next/link";

export default function Home() {
    return (
        <>
            {/* Hero Section */}
            <section className="min-h-screen flex items-center px-6 md:px-16 lg:px-24 pt-32 md:pt-20 pointer-events-none">
                <div className="max-w-4xl w-full pointer-events-auto">
                    <span className="text-brand-blue text-[10px] md:text-xs font-semibold tracking-[0.2em] uppercase mb-6 block">
                        WHERE TALENT AND OPPORTUNITY COME TOGETHER.
                    </span>
                    
                    <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-bold text-white leading-[1.1] mb-4 tracking-tight">
                        From Idea to <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-green">
                            Delivered Project.
                        </span>
                    </h1>

                    <h2 className="text-2xl md:text-4xl text-slate-400 font-light mb-8">
                        A representation layer for those who create.
                    </h2>

                    <p className="text-sm md:text-lg text-slate-300 font-light leading-relaxed max-w-2xl mb-12">
                        Submit your project requirements and TalentEarthStudios will scope the work, align the right team, build the schedule, and manage delivery from start to finish.
                    </p>

                    {/* Process Graphics */}
                    <div className="flex items-center gap-4 md:gap-8 mb-16 overflow-x-auto pb-4 hide-scrollbar">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full border border-slate-600 flex items-center justify-center text-brand-blue">
                                <i className="ph ph-lightbulb text-2xl"></i>
                            </div>
                            <span className="text-xs text-white">Idea In</span>
                        </div>
                        <i className="ph ph-caret-right text-slate-600 text-xl -mt-6"></i>
                        
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full border border-slate-600 flex items-center justify-center text-brand-blue">
                                <i className="ph ph-users text-2xl"></i>
                            </div>
                            <span className="text-xs text-white">Team Aligned</span>
                        </div>
                        <i className="ph ph-caret-right text-slate-600 text-xl -mt-6"></i>

                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full border border-slate-600 flex items-center justify-center text-brand-green">
                                <i className="ph ph-calendar-blank text-2xl"></i>
                            </div>
                            <span className="text-xs text-white">Schedule Built</span>
                        </div>
                        <i className="ph ph-caret-right text-slate-600 text-xl -mt-6"></i>

                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full border border-brand-green flex items-center justify-center text-brand-green">
                                <i className="ph ph-check-circle text-2xl"></i>
                            </div>
                            <span className="text-xs text-white">Project Delivered</span>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link href="/request" className="flex items-center justify-between gap-4 px-8 py-4 bg-brand-green hover:bg-brand-green/90 text-white rounded-md font-medium text-sm transition-colors">
                            Start Your Project
                            <i className="ph ph-arrow-right"></i>
                        </Link>
                        <Link href="/specialty" className="flex items-center justify-between gap-4 px-8 py-4 bg-slate-900/40 hover:bg-slate-800/60 border border-slate-700 text-white rounded-md font-medium text-sm transition-colors backdrop-blur-sm">
                            Explore Specialty Teams
                            <i className="ph ph-arrow-right"></i>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Information Panels */}
            <section className="min-h-screen bg-gradient-to-b from-transparent via-wme-base/90 to-wme-base pb-32">
                <div className="max-w-7xl mx-auto px-6 sm:px-12 pt-12 md:pt-32 space-y-12 md:space-y-16">

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="glass-panel p-6 md:p-8 min-h-[240px] md:min-h-[320px] flex flex-col justify-between group hover:border-slate-700 transition-colors duration-500 cursor-default">
                            <div className="text-xs font-mono text-slate-600 mb-4">01 // REPRESENTATION</div>
                            <div>
                                <h3 className="text-white text-lg font-normal mb-3">Managed Talent</h3>
                                <p className="text-sm text-slate-400 leading-relaxed font-light select-text">
                                    We represent the technical and creative architects behind global production. Not a roster of faces, but a network of verified capabilities.
                                </p>
                            </div>
                            <div className="w-full h-px bg-slate-800 mt-6 md:mt-8 group-hover:bg-slate-600 transition-colors"></div>
                        </div>

                        <div className="glass-panel p-6 md:p-8 min-h-[240px] md:min-h-[320px] flex flex-col justify-between group hover:border-slate-700 transition-colors duration-500 cursor-default">
                            <div className="text-xs font-mono text-slate-600 mb-4">02 // ASSEMBLY</div>
                            <div>
                                <h3 className="text-white text-lg font-normal mb-3">Team Construction</h3>
                                <p className="text-sm text-slate-400 leading-relaxed font-light select-text">
                                    Deploy complete operational units. From experiential fabrication to virtual production, teams are scoped and deployed as single entities.
                                </p>
                            </div>
                            <div className="w-full h-px bg-slate-800 mt-6 md:mt-8 group-hover:bg-slate-600 transition-colors"></div>
                        </div>

                        <div className="glass-panel p-6 md:p-8 min-h-[240px] md:min-h-[320px] flex flex-col justify-between group hover:border-slate-700 transition-colors duration-500 cursor-default">
                            <div className="text-xs font-mono text-slate-600 mb-4">03 // DELIVERY</div>
                            <div>
                                <h3 className="text-white text-lg font-normal mb-3">Oversight & Scope</h3>
                                <p className="text-sm text-slate-400 leading-relaxed font-light select-text">
                                    TalentEarthStudios acts as the operating layer. Contracts, insurance, and technical riders are standardized, removing friction from complex builds.
                                </p>
                            </div>
                            <div className="w-full h-px bg-slate-800 mt-6 md:mt-8 group-hover:bg-slate-600 transition-colors"></div>
                        </div>
                    </div>

                    <div className="glass-panel p-6 md:p-8 border border-wme-border">
                        <div className="text-xs font-mono text-slate-600 mb-4">EXECUTION DOMAINS</div>
                        <div className="flex flex-wrap gap-2 text-[10px] md:text-xs font-mono text-slate-400 select-none">
                            <span className="px-3 py-1 border border-slate-800 bg-wme-panel">Build</span>
                            <span className="px-3 py-1 border border-slate-800 bg-wme-panel">Fabrication</span>
                            <span className="px-3 py-1 border border-slate-800 bg-wme-panel">Technical Direction</span>
                            <span className="px-3 py-1 border border-slate-800 bg-wme-panel">Systems</span>
                            <span className="px-3 py-1 border border-slate-800 bg-wme-panel">Media</span>
                            <span className="px-3 py-1 border border-slate-800 bg-wme-panel">Interactive</span>
                            <span className="px-3 py-1 border border-slate-800 bg-wme-panel">Installation</span>
                            <span className="px-3 py-1 border border-slate-800 bg-wme-panel">Operations</span>
                            <span className="px-3 py-1 border border-slate-800 bg-wme-panel">Compliance</span>
                            <span className="px-3 py-1 border border-slate-800 bg-wme-panel">Specialized</span>
                        </div>
                    </div>

                    <div className="text-center pb-12">
                        <Link href="/talent" className="inline-block text-xs uppercase tracking-[0.2em] text-white border border-slate-700 px-8 py-4 hover:bg-white hover:text-black transition-all duration-500 focus:outline-none w-full md:w-auto">
                            Access The System
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
