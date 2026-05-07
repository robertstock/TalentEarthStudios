"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { MOCK_TALENTS } from "@/lib/mock-data";

function SignInForm() {
    const [selectedEmail, setSelectedEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const emailToUse = selectedEmail || "finley@talentearth.com"; // default to admin
        
        // Route Finley to Admin, and Talents directly to their Portfolio editor
        const destination = emailToUse === "finley@talentearth.com" ? "/admin" : "/app/portfolio";

        await signIn("credentials", {
            email: emailToUse,
            password: "password123",
            callbackUrl: destination
        });
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 shadow-2xl">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Demo Access</h1>
                    <p className="text-sm text-gray-400">Select a mock user to enter the dashboard</p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-medium uppercase tracking-wider text-blue-400 block mb-2">Select Demo User</label>
                        <select
                            value={selectedEmail}
                            onChange={(e) => setSelectedEmail(e.target.value)}
                            className="w-full rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-all appearance-none cursor-pointer"
                        >
                            <option value="finley@talentearth.com">⭐ Finley (Admin Dashboard)</option>
                            <optgroup label="Mock Talents (Portfolio Dashboard)">
                                {MOCK_TALENTS.map(talent => (
                                    <option key={talent.id} value={talent.email}>
                                        {talent.firstName} {talent.lastName} - {talent.profile.primaryDiscipline}
                                    </option>
                                ))}
                            </optgroup>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-all hover:bg-blue-500 flex items-center justify-center gap-2 shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <i className="ph ph-spinner-gap animate-spin"></i> Authenticating...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <i className="ph ph-sign-in text-lg"></i> Sign In to Demo
                            </span>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-gray-600">
                    Authentication is bypassed for this demo environment. Passwords are not required.
                </div>
            </div>
        </div>
    );
}

export default function SignInPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>}>
            <SignInForm />
        </Suspense>
    );
}
