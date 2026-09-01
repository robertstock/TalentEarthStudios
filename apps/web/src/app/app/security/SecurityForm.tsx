"use client";

import { FormEvent, useState } from "react";

export default function SecurityForm() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage("");

        if (newPassword !== confirmPassword) {
            setStatus("error");
            setMessage("The new passwords do not match.");
            return;
        }

        setStatus("saving");

        try {
            const response = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Password could not be changed.");
            }

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setStatus("success");
            setMessage("Your password has been changed.");
        } catch (error) {
            setStatus("error");
            setMessage(error instanceof Error ? error.message : "Password could not be changed.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="space-y-2">
                <label htmlFor="current-password" className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Current Password</label>
                <input
                    id="current-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="new-password" className="block text-xs font-semibold uppercase tracking-wider text-gray-400">New Password</label>
                <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={128}
                    required
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="text-xs text-gray-500">Use at least 12 characters.</p>
            </div>

            <div className="space-y-2">
                <label htmlFor="confirm-password" className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Confirm New Password</label>
                <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={128}
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20"
                />
            </div>

            {message && (
                <p className={`rounded-lg border p-3 text-sm ${status === "success" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-red-500/20 bg-red-500/10 text-red-400"}`} role={status === "error" ? "alert" : "status"}>
                    {message}
                </p>
            )}

            <button
                type="submit"
                disabled={status === "saving"}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {status === "saving" ? "Changing password..." : "Change Password"}
            </button>
        </form>
    );
}
