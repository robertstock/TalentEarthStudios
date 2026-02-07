import Link from "next/link";

export default function Home() {
    return (
        <>
            {/* Hero Section */}
            <section className="min-h-screen flex items-center px-6 md:px-16 lg:px-24 pt-20 md:pt-0 pointer-events-none">
                <div className="max-w-3xl w-full pointer-events-auto">
                    <h1 className="text-4xl xs:text-5xl md:text-6xl lg:text-7xl font-light text-white leading-tight mb-6 md:mb-8 select-none">
                        A representation layer<br />
                        <span className="text-slate-500">for those who create.</span>
                    </h1>

                    <p className="text-lg md:text-2xl text-slate-200 font-normal leading-relaxed max-w-xl md:max-w-3xl border-l-2 border-slate-700 pl-4 md:pl-6 select-text mb-8 shadow-black drop-shadow-sm">
                        Designers, engineers, fabricators, and operators represented through a managed execution system built for real production.
                    </p>

                    <div className="mt-8 md:mt-12 flex flex-wrap gap-4 md:gap-6 text-[10px] md:text-xs uppercase tracking-widest text-slate-500 select-none">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-900/10 border border-green-900/20 rounded-full md:bg-transparent md:border-none md:p-0 md:rounded-none">
                            <div className="w-1.5 h-1.5 bg-green-500 md:bg-green-900 rounded-full animate-pulse"></div>
                            System Active
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/30 border border-slate-700/30 rounded-full md:bg-transparent md:border-none md:p-0 md:rounded-none">
                            <div className="w-1.5 h-1.5 bg-slate-400 md:bg-slate-600 rounded-full"></div>
                            Global Nodes: 247
                        </div>
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
