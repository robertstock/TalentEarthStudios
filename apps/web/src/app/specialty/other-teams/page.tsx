import Link from "next/link";

export default function OtherTeamsPage() {
    const teams = [
        { name: "RareBird Games Inc.", members: 2 },
        { name: "Pixel Pioneers - Video Wall Team", members: 1 },
        { name: "3D Specialists", members: 1 },
        { name: "Embroidery/Silk Screen Specialists", members: 1 },
        { name: "Hand Painted Logo/Scenic Painters", members: 3 },
        { name: "Motion Graphics Team", members: 1 },
    ];

    return (
        <div className="relative w-full min-h-screen pt-32 pb-20 px-6 md:px-16 lg:px-24 flex flex-col items-center">
            <div className="max-w-5xl w-full z-10">
                <div className="mb-12">
                    <Link href="/specialty" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm uppercase tracking-widest font-medium group w-fit">
                        <i className="ph ph-arrow-left group-hover:-translate-x-1 transition-transform"></i>
                        Back to Specialty Teams
                    </Link>
                </div>

                <div className="text-center mb-16">
                    <span className="text-brand-blue text-xs md:text-sm font-semibold tracking-[0.2em] uppercase mb-4 block">
                        Our Network
                    </span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
                        Other <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-green">Teams.</span>
                    </h1>
                    <p className="text-sm md:text-base text-slate-300 font-light leading-relaxed max-w-2xl mx-auto">
                        Beyond our primary specialty teams, TalentEarthStudios maintains a curated network of elite specialists ready to deploy for any specialized creative or technical execution.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.map((team, index) => (
                        <div 
                            key={index}
                            className="bg-wme-panel border border-wme-border rounded-xl p-6 hover:border-brand-blue/50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,174,239,0.1)] relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <h3 className="text-lg font-medium text-white mb-2">{team.name}</h3>
                                    <p className="text-sm text-slate-400 font-light">
                                        Total Members: {team.members}
                                    </p>
                                </div>
                                <div className="mt-6">
                                    <Link 
                                        href="/request"
                                        className="text-xs text-brand-green uppercase tracking-widest font-semibold flex items-center gap-2 group-hover:gap-3 transition-all"
                                    >
                                        Request Team
                                        <i className="ph ph-arrow-right"></i>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <Link 
                        href="/request" 
                        className="inline-flex bg-brand-blue hover:bg-brand-blue/90 text-white px-8 py-4 rounded-md font-semibold tracking-widest uppercase text-sm transition-all shadow-[0_0_20px_rgba(0,174,239,0.3)] hover:shadow-[0_0_30px_rgba(0,174,239,0.5)] items-center gap-3"
                    >
                        Start Your Project
                        <i className="ph ph-paper-plane-right"></i>
                    </Link>
                </div>
            </div>
        </div>
    );
}
