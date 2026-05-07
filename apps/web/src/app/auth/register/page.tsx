"use client";

import { useState } from "react";
import Link from "next/link";
import { MOCK_TALENTS } from "@/lib/mock-data";

export default function RegisterDemoPage() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        portfolioUrl: "",
    });
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tempPortfolio, setTempPortfolio] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAutoFill = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedTalent = MOCK_TALENTS.find(t => t.id === e.target.value);
        if (selectedTalent) {
            setFormData({
                firstName: selectedTalent.firstName,
                lastName: selectedTalent.lastName,
                email: selectedTalent.email,
                password: "password123", // Demo default password
                portfolioUrl: selectedTalent.portfolio?.[0]?.assetUrl || "https://example.com/portfolio",
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate network delay for approval routing
        setTimeout(() => {
            setLoading(false);
            setSuccess(true);
        }, 1500);
    };

    const handleSavePortfolio = () => {
        if (tempPortfolio) {
            setFormData({ ...formData, portfolioUrl: tempPortfolio });
        }
        setIsModalOpen(false);
    };

    if (success) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4">
                <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 shadow-2xl text-center">
                    <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-6">
                        <i className="ph ph-check-circle text-4xl text-blue-400"></i>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-4">Application Submitted!</h1>
                    <p className="text-sm text-gray-400 mb-8">
                        Your profile and portfolio have been sent to our recruitment team for approval. You will receive an email once your account is activated.
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
            <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 shadow-2xl">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Join TalentEarth</h1>
                    <p className="text-sm text-gray-400">Apply to join the execution network</p>
                </div>

                <div className="mb-6 pb-6 border-b border-white/10">
                    <label className="text-xs font-medium uppercase tracking-wider text-blue-400 mb-2 block">Demo Auto-Fill</label>
                    <select
                        onChange={handleAutoFill}
                        className="w-full rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-white focus:border-blue-500 focus:outline-none transition-all appearance-none cursor-pointer"
                    >
                        <option value="">-- Select a mock talent to auto-fill --</option>
                        {MOCK_TALENTS.map(talent => (
                            <option key={talent.id} value={talent.id}>
                                {talent.firstName} {talent.lastName} ({talent.profile.primaryDiscipline})
                            </option>
                        ))}
                    </select>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium uppercase tracking-wider text-gray-500">First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                required
                                value={formData.firstName}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium uppercase tracking-wider text-gray-500">Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                required
                                value={formData.lastName}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium uppercase tracking-wider text-gray-500">Email</label>
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium uppercase tracking-wider text-gray-500 block">Portfolio</label>
                        {formData.portfolioUrl ? (
                            <div className="w-full rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-green-400 flex items-center justify-between cursor-pointer" onClick={() => setIsModalOpen(true)}>
                                <div className="flex items-center gap-2">
                                    <i className="ph ph-check-circle text-lg"></i>
                                    <span className="text-sm truncate max-w-[200px]">{formData.portfolioUrl}</span>
                                </div>
                                <span className="text-xs uppercase tracking-wider opacity-60">Edit</span>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(true)}
                                className="w-full rounded-lg border border-dashed border-white/20 bg-white/[0.02] px-4 py-4 text-slate-400 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all flex flex-col items-center gap-2"
                            >
                                <i className="ph ph-upload-simple text-2xl"></i>
                                <span className="text-sm">Upload Documents or Link Instagram</span>
                            </button>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium uppercase tracking-wider text-gray-500">Password</label>
                        <input
                            type="password"
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !formData.firstName || !formData.portfolioUrl}
                        className="w-full mt-4 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)]"
                    >
                        {loading ? "Sending for approval..." : "Submit Application"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500">
                    Already approved?{" "}
                    <Link href="/auth/signin" className="text-blue-400 hover:text-blue-300 font-medium">
                        Sign in
                    </Link>
                </p>
            </div>

            {/* Portfolio Modal overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                        >
                            <i className="ph ph-x text-xl"></i>
                        </button>
                        
                        <h2 className="text-xl font-bold text-white mb-6">Attach Portfolio</h2>
                        
                        <div className="space-y-6">
                            <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center bg-slate-800/30 hover:bg-slate-800/50 hover:border-blue-500/50 transition-all cursor-pointer group">
                                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                    <i className="ph ph-file-pdf text-2xl text-slate-400 group-hover:text-blue-400 transition-colors"></i>
                                </div>
                                <p className="text-sm font-medium text-white mb-1">Click to upload documents</p>
                                <p className="text-xs text-slate-500">PDF, JPG, PNG (Max 10MB)</p>
                            </div>
                            
                            <div className="relative flex items-center py-2">
                                <div className="flex-grow border-t border-slate-700"></div>
                                <span className="flex-shrink-0 mx-4 text-xs text-slate-500 uppercase tracking-widest">OR</span>
                                <div className="flex-grow border-t border-slate-700"></div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium uppercase tracking-wider text-gray-400">Link Instagram or Website</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <i className="ph ph-instagram-logo text-slate-500"></i>
                                    </div>
                                    <input
                                        type="url"
                                        value={tempPortfolio}
                                        onChange={(e) => setTempPortfolio(e.target.value)}
                                        placeholder="https://instagram.com/username"
                                        className="w-full rounded-lg border border-slate-700 bg-slate-950 py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-4 border-t border-slate-800 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSavePortfolio}
                                disabled={!tempPortfolio}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Save Portfolio
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
