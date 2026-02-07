"use client";

import Link from "next/link";

const LogoImage = "/TalentEarthStudioLogo_White.png"; // Updated to public path
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import UserDropdown from "./UserDropdown";

export default function Navbar() {
    const { data: session } = useSession();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/" });
    };

    const navLinkClass = "hover:text-white transition-colors duration-300 focus:outline-none";

    return (
        <>
            <nav className="fixed top-0 w-full z-50 px-6 md:px-8 py-6 flex justify-between items-center select-none bg-gradient-to-b from-black/50 to-transparent md:bg-none pointer-events-auto">
                {/* Logo */}
                <Link href="/" className="z-50 cursor-pointer flex items-center gap-2">
                    <img
                        src={LogoImage}
                        alt="TalentEarthStudios"
                        className="w-auto h-10 object-contain"
                    />
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex gap-8 text-xs font-medium tracking-widest uppercase text-slate-400">
                    <Link href="/" className={navLinkClass}>Business Demo Page</Link>
                    <Link href="/website" className={navLinkClass}>Overview</Link>
                    <Link href="/talent" className={navLinkClass}>Talent</Link>
                    <Link href="/teams" className={navLinkClass}>Teams</Link>
                    <Link href="/request" className={navLinkClass}>Request</Link>

                    {session ? (
                        <>
                            {session.user.role === 'ADMIN' && (
                                <Link href="/admin" className={navLinkClass}>Admin</Link>
                            )}
                            <UserDropdown user={session.user} />
                        </>
                    ) : (
                        <Link href="/auth/signin" className={navLinkClass}>Sign In</Link>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden text-white focus:outline-none z-50 p-2 -mr-2"
                >
                    <i className={`ph ${mobileMenuOpen ? 'ph-x' : 'ph-list'} text-2xl`}></i>
                </button>
            </nav>

            {/* Mobile Menu Overlay */}
            <div className={`fixed inset-0 z-40 bg-wme-base/95 backdrop-blur-xl flex flex-col justify-center items-center transition-all duration-300 transform ${mobileMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <div className="flex flex-col gap-8 text-center">
                    <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-light text-white tracking-widest uppercase hover:text-slate-400 transition-colors">Business Demo Page</Link>
                    <Link href="/website" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-light text-white tracking-widest uppercase hover:text-slate-400 transition-colors">Overview</Link>
                    <Link href="/talent" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-light text-white tracking-widest uppercase hover:text-slate-400 transition-colors">Talent</Link>
                    <Link href="/teams" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-light text-white tracking-widest uppercase hover:text-slate-400 transition-colors">Teams</Link>
                    <Link href="/request" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-light text-white tracking-widest uppercase hover:text-slate-400 transition-colors">Request</Link>

                    {session ? (
                        <>
                            <Link href="/app" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-light text-white tracking-widest uppercase hover:text-slate-400 transition-colors">Dashboard</Link>
                            <button onClick={() => { setMobileMenuOpen(false); handleSignOut(); }} className="text-2xl font-light text-white tracking-widest uppercase hover:text-slate-400 transition-colors">Sign Out</button>
                        </>
                    ) : (
                        <Link href="/auth/signin" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-light text-white tracking-widest uppercase hover:text-slate-400 transition-colors">Sign In</Link>
                    )}
                </div>
                <div className="absolute bottom-12 text-[10px] text-slate-600 font-mono">
                    SYSTEM STATUS: ONLINE
                </div>
            </div>
        </>
    );
}
