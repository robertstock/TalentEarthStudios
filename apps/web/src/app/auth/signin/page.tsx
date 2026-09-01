"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SignInForm() {
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        const destination = searchParams.get("callbackUrl") || "/admin";

        const result = await signIn("credentials", {
            email: email.trim().toLowerCase(),
            password: password,
            callbackUrl: destination,
            redirect: false
        });

        if (result?.error) {
            setLoading(false);
            setErrorMsg("The email or password is incorrect.");
        } else {
            if (result?.url) window.location.href = result.url;
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 shadow-2xl">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Member Access</h1>
                    <p className="text-sm text-gray-400">Sign in with your TalentEarth account.</p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="signin-email" className="text-xs font-medium uppercase tracking-wider text-blue-400 block mb-2">Email Address</label>
                        <input
                            id="signin-email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="w-full rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-all placeholder:text-white/30"
                            placeholder="name@company.com"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                            <label htmlFor="signin-password" className="text-xs font-medium uppercase tracking-wider text-blue-400 block">Password</label>
                            <Link href="/auth/forgot-password" className="text-xs text-blue-300 transition-colors hover:text-white">
                                Forgot password?
                            </Link>
                        </div>
                        <input
                            id="signin-password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-all placeholder:text-white/30"
                            placeholder="Enter password..."
                            required
                        />
                    </div>

                    {errorMsg && (
                        <div className="text-red-400 text-sm font-medium p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                            {errorMsg}
                        </div>
                    )}

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
                                <i className="ph ph-sign-in text-lg"></i> Sign In
                            </span>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-gray-500 space-y-4 border-t border-white/5 pt-4">
                    <p className="text-gray-400 leading-relaxed">
                        Need access or account help? Email{" "}
                        <a href="mailto:admin@talentearth.com" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors font-medium">
                            admin@talentearth.com
                        </a>
                    </p>
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
