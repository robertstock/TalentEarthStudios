"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        portfolioUrl: "",
    });
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
        setErrorMessage("");
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setErrorMessage("");

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Your application could not be submitted.");
            }

            setSuccess(true);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Your application could not be submitted.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4">
                <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-8 text-center shadow-2xl backdrop-blur-xl">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20">
                        <i className="ph ph-check-circle text-4xl text-blue-400"></i>
                    </div>
                    <h1 className="mb-4 text-2xl font-bold tracking-tight text-white">Application Submitted</h1>
                    <p className="mb-8 text-sm text-gray-400">
                        Your account and portfolio link were saved for review. You will be contacted after the application is approved.
                    </p>
                    <Link href="/" className="inline-block w-full rounded-lg bg-white/10 px-4 py-3 font-semibold text-white transition-all hover:bg-white/20">
                        Return to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-8 shadow-2xl backdrop-blur-xl">
                <div className="mb-8 text-center">
                    <h1 className="mb-2 text-3xl font-bold tracking-tight text-white">Join TalentEarth</h1>
                    <p className="text-sm text-gray-400">Apply to join the execution network.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="register-first-name" className="text-xs font-medium uppercase tracking-wider text-gray-500">First Name</label>
                            <input
                                id="register-first-name"
                                type="text"
                                name="firstName"
                                autoComplete="given-name"
                                required
                                value={formData.firstName}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="register-last-name" className="text-xs font-medium uppercase tracking-wider text-gray-500">Last Name</label>
                            <input
                                id="register-last-name"
                                type="text"
                                name="lastName"
                                autoComplete="family-name"
                                required
                                value={formData.lastName}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="register-email" className="text-xs font-medium uppercase tracking-wider text-gray-500">Email</label>
                        <input
                            id="register-email"
                            type="email"
                            name="email"
                            autoComplete="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="register-portfolio" className="text-xs font-medium uppercase tracking-wider text-gray-500">Portfolio Link</label>
                        <input
                            id="register-portfolio"
                            type="url"
                            name="portfolioUrl"
                            required
                            value={formData.portfolioUrl}
                            onChange={handleChange}
                            placeholder="https://your-portfolio.com"
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="register-password" className="text-xs font-medium uppercase tracking-wider text-gray-500">Password</label>
                        <input
                            id="register-password"
                            type="password"
                            name="password"
                            autoComplete="new-password"
                            minLength={8}
                            required
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="At least 8 characters"
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    {errorMessage && (
                        <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-400" role="alert">
                            {errorMessage}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)] transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? "Saving application..." : "Submit Application"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500">
                    Already approved?{" "}
                    <Link href="/auth/signin" className="font-medium text-blue-400 hover:text-blue-300">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
