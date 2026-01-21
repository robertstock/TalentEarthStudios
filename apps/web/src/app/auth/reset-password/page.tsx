"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            setStatus("error");
            setErrorMessage("Invalid or missing reset token.");
            return;
        }

        setStatus("loading");
        setErrorMessage("");

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Something went wrong");
            }

            setStatus("success");
            // Optional: Redirect after a few seconds
            setTimeout(() => {
                router.push("/auth/signin");
            }, 3000);

        } catch (error: any) {
            setStatus("error");
            setErrorMessage(error.message || "Failed to reset password.");
        }
    };

    if (!token) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4">
                <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 text-center text-white">
                    <p className="mb-4 text-red-400">Invalid link. The token is missing.</p>
                    <Link href="/auth/forgot-password" className="text-blue-400 hover:text-blue-300">
                        Request a new one
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 shadow-2xl">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Reset Password</h1>
                    <p className="text-sm text-gray-400">Enter your new password below</p>
                </div>

                {status === "success" ? (
                    <div className="text-center space-y-4">
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
                            Password reset successfully! Redirecting you to sign in...
                        </div>
                        <Link href="/auth/signin" className="block w-full rounded-lg bg-white/10 px-4 py-3 font-semibold text-white transition-all hover:bg-white/20">
                            Sign In Now
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {status === "error" && (
                            <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
                                {errorMessage}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-medium uppercase tracking-wider text-gray-500">New Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                placeholder="••••••••"
                                minLength={6}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={status === "loading"}
                            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)]"
                        >
                            {status === "loading" ? "Resetting..." : "Reset Password"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
