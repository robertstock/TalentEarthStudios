"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";

interface UserDropdownProps {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        id?: string;
    };
}

export default function UserDropdown({ user }: UserDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/" });
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 focus:outline-none"
            >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 relative bg-slate-800 hover:border-blue-500/50 transition-colors">
                    {user.image ? (
                        <Image
                            src={user.image}
                            alt={user.name || "User"}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-white uppercase font-bold">
                            {(user.name?.[0] || user.email?.[0] || "U").toUpperCase()}
                        </div>
                    )}
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-black/90 border border-white/10 rounded-lg shadow-xl backdrop-blur-xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-white/10 mb-1">
                        <p className="text-xs text-slate-400 font-mono truncate">{user.email}</p>
                    </div>

                    <Link
                        href="/app"
                        onClick={() => setIsOpen(false)}
                        className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                    >
                        Dashboard
                    </Link>

                    {user.id && (
                        <Link
                            href={`/talent/${user.id}`}
                            onClick={() => setIsOpen(false)}
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                        >
                            Public Profile
                        </Link>
                    )}

                    <div className="border-t border-white/10 my-1"></div>

                    <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
}
