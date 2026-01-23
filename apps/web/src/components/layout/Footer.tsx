"use client";

import Image from "next/image";
import LogoImage from "@/app/talentearth_logo.png";

export default function Footer() {
    return (
        <footer className="w-full py-8 mt-20 border-t border-white/10 bg-black/20 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center gap-4 text-center">
                <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity duration-300">
                    <span className="text-xs font-mono tracking-widest text-slate-500 uppercase">Powered by</span>
                    <div className="relative h-6 w-24">
                        <Image
                            src={LogoImage}
                            alt="Talent Earth Studios"
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>
                <p className="text-[10px] text-slate-700 font-mono">
                    © {new Date().getFullYear()} Talent Earth Studios. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
