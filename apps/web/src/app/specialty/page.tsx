"use client";

import Link from "next/link";

export default function SpecialtyPage() {
    const specialtyLinks = [
        { title: "Visual Media", url: "/specialty/visualmedia", icon: "ph-monitor-play" },
        { title: "Audio + Score", url: "/specialty/audio-score", icon: "ph-speaker-hifi" },
        { title: "Film + Video", url: "/specialty/film-video", icon: "ph-film-strip" },
        { title: "MotionRobot", url: "/specialty/motionrobot", icon: "ph-robot" },
        { title: "SFX + Props", url: "/specialty/sfx", icon: "ph-magic-wand" },
        { title: "XR (AR/VR Reality)", url: "/specialty/xr", icon: "ph-virtual-reality" },
        { title: "Interactive Games", url: "/specialty/film-sets", icon: "ph-game-controller" },
        { title: "Other Teams", url: "/specialty/other-teams", icon: "ph-users-three" },
    ];

    return (
        <div className="relative z-10 w-full min-h-screen pt-32 pb-20 px-6 md:px-16 lg:px-24 flex items-center justify-center pointer-events-none">
            <div className="max-w-5xl w-full pointer-events-auto">
                <div className="text-center mb-16">
                    <span className="text-brand-blue text-xs md:text-sm font-semibold tracking-[0.2em] uppercase mb-4 block">
                        Our Expertise
                    </span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
                        Specialty <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-green">Teams.</span>
                    </h1>
                    <p className="text-sm md:text-base text-slate-300 font-light leading-relaxed max-w-3xl mx-auto">
                        TalentEarthStudios collaborates with agencies and brands to bring creative visions to life with efficiency and expertise. Our curated Team Leaders provide proven industry experience, ensuring seamless execution on every project. With a track record of delivering high-quality solutions across a range of industries, we take pride in being a trusted partner for impactful and innovative storytelling.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {specialtyLinks.map((link, index) => (
                        <Link
                            key={index}
                            href={link.url}
                            className="group relative h-40 overflow-hidden rounded-xl bg-slate-900/40 backdrop-blur-sm border border-slate-700 hover:border-brand-blue/50 transition-all duration-300 flex flex-col items-center justify-center p-6 text-center transform hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,174,239,0.1)] pointer-events-auto"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            
                            <i className={`ph ${link.icon} text-3xl text-brand-blue mb-3 group-hover:scale-110 transition-transform duration-300`}></i>
                            <h3 className="relative z-10 text-lg font-medium text-slate-200 group-hover:text-white transition-colors">
                                {link.title}
                            </h3>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
