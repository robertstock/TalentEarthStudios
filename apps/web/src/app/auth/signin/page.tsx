"use client";

import { Suspense } from "react";
import Link from "next/link";

function SignInForm() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 shadow-2xl">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Demo Access</h1>
                    <p className="text-sm text-gray-400">Enter the admin dashboard in demo mode</p>
                </div>

                <Link
                    href="/admin"
                    className="w-full mb-4 rounded-lg bg-emerald-600/20 border border-emerald-500/50 px-4 py-3 font-semibold text-emerald-400 transition-all hover:bg-emerald-600/30 flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Enter Demo Mode (Admin)
                </Link>

                <div className="mt-6 text-center text-xs text-gray-600">
                    Authentication is disabled for this demo.
                </div>
            </div>
        </div>
    );
}

export default function SignInPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SignInForm />
        </Suspense>
    );
}
