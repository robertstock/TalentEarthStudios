"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState, useTransition } from "react";

import {
    createAdministrator,
    sendAdministratorSetupLink,
    setAdministratorActive,
    type AdministratorActionResult,
} from "./actions";

export type AdministratorSummary = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    active: boolean;
    hasPassword: boolean;
    createdAt: string;
};

type AdminManagementClientProps = {
    administrators: AdministratorSummary[];
    currentAdministratorId: string;
};

const initialResult: AdministratorActionResult = { status: "idle", message: "" };

export default function AdminManagementClient({
    administrators,
    currentAdministratorId,
}: AdminManagementClientProps) {
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<AdministratorActionResult>(initialResult);

    const activeAdministrators = administrators.filter((administrator) => administrator.active);
    const inactiveAdministrators = administrators.filter((administrator) => !administrator.active);

    function handleCreateAdministrator(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
            const response = await createAdministrator(formData);
            setResult(response);

            if (response.status === "success" || response.status === "warning") {
                formRef.current?.reset();
                router.refresh();
            }
        });
    }

    function handleSetupLink(administrator: AdministratorSummary) {
        setResult(initialResult);
        startTransition(async () => {
            const response = await sendAdministratorSetupLink(administrator.id);
            setResult(response);
            router.refresh();
        });
    }

    function handleAccessChange(administrator: AdministratorSummary, active: boolean) {
        if (!active) {
            const confirmed = window.confirm(
                `Deactivate ${administrator.firstName} ${administrator.lastName}? They will no longer be able to sign in.`,
            );
            if (!confirmed) return;
        }

        setResult(initialResult);
        startTransition(async () => {
            const response = await setAdministratorActive(administrator.id, active);
            setResult(response);
            router.refresh();
        });
    }

    const resultStyles = {
        success: "border-emerald-500/40 bg-emerald-950/40 text-emerald-200",
        warning: "border-amber-500/40 bg-amber-950/40 text-amber-200",
        error: "border-red-500/40 bg-red-950/40 text-red-200",
        idle: "",
    }[result.status];

    return (
        <main className="container mx-auto min-h-screen px-6 pb-16 pt-32 text-white">
            <div className="mb-8">
                <Link
                    href="/admin"
                    className="mb-4 flex w-fit items-center gap-2 text-sm text-gray-400 transition hover:text-white"
                >
                    <i className="ph ph-arrow-left" aria-hidden="true" /> Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold">Manage Administrators</h1>
                <p className="mt-2 max-w-3xl text-sm text-gray-400">
                    Add trusted administrators, send secure password setup links, and control access. Passwords are
                    never displayed or emailed.
                </p>
            </div>

            {result.status !== "idle" && (
                <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${resultStyles}`} role="status">
                    {result.message}
                </div>
            )}

            <section className="mb-10 rounded-xl border border-white/10 bg-white/5 p-6">
                <div className="mb-5">
                    <h2 className="text-xl font-bold">Add an Administrator</h2>
                    <p className="mt-1 text-sm text-gray-400">
                        They will receive a one-time link that expires after one hour so they can choose their own password.
                    </p>
                </div>

                <form ref={formRef} onSubmit={handleCreateAdministrator} className="grid gap-4 md:grid-cols-3">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                        First name
                        <input
                            name="firstName"
                            type="text"
                            required
                            maxLength={80}
                            autoComplete="given-name"
                            className="mt-2 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-3 text-base normal-case tracking-normal text-white outline-none transition focus:border-blue-500"
                        />
                    </label>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Last name
                        <input
                            name="lastName"
                            type="text"
                            required
                            maxLength={80}
                            autoComplete="family-name"
                            className="mt-2 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-3 text-base normal-case tracking-normal text-white outline-none transition focus:border-blue-500"
                        />
                    </label>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                        Email address
                        <input
                            name="email"
                            type="email"
                            required
                            maxLength={254}
                            autoComplete="email"
                            className="mt-2 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-3 text-base normal-case tracking-normal text-white outline-none transition focus:border-blue-500"
                        />
                    </label>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-3 md:w-fit"
                    >
                        <i className="ph ph-user-plus" aria-hidden="true" />
                        {isPending ? "Working…" : "Add Administrator & Send Setup Link"}
                    </button>
                </form>
            </section>

            <section>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold">Administrator Access</h2>
                        <p className="mt-1 text-sm text-gray-400">
                            {activeAdministrators.length} active administrator{activeAdministrators.length === 1 ? "" : "s"}
                        </p>
                    </div>
                    <p className="max-w-xl text-xs text-gray-500">
                        Deactivated accounts remain in the audit history but cannot sign in or use administrator tools.
                    </p>
                </div>

                <div className="space-y-4">
                    {activeAdministrators.map((administrator) => (
                        <AdministratorCard
                            key={administrator.id}
                            administrator={administrator}
                            currentAdministratorId={currentAdministratorId}
                            isPending={isPending}
                            onSetupLink={handleSetupLink}
                            onAccessChange={handleAccessChange}
                        />
                    ))}

                    {inactiveAdministrators.length > 0 && (
                        <div className="pt-5">
                            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">
                                Deactivated Administrators
                            </h3>
                            <div className="space-y-4">
                                {inactiveAdministrators.map((administrator) => (
                                    <AdministratorCard
                                        key={administrator.id}
                                        administrator={administrator}
                                        currentAdministratorId={currentAdministratorId}
                                        isPending={isPending}
                                        onSetupLink={handleSetupLink}
                                        onAccessChange={handleAccessChange}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}

type AdministratorCardProps = {
    administrator: AdministratorSummary;
    currentAdministratorId: string;
    isPending: boolean;
    onSetupLink: (administrator: AdministratorSummary) => void;
    onAccessChange: (administrator: AdministratorSummary, active: boolean) => void;
};

function AdministratorCard({
    administrator,
    currentAdministratorId,
    isPending,
    onSetupLink,
    onAccessChange,
}: AdministratorCardProps) {
    const isCurrentAdministrator = administrator.id === currentAdministratorId;

    return (
        <article className="rounded-xl border border-white/10 bg-[#080d15]/80 p-5">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold">
                            {administrator.firstName} {administrator.lastName}
                        </h3>
                        {isCurrentAdministrator && (
                            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-300">
                                You
                            </span>
                        )}
                        <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                administrator.active
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                    : "border-gray-500/30 bg-gray-500/10 text-gray-400"
                            }`}
                        >
                            {administrator.active ? "Active" : "Deactivated"}
                        </span>
                    </div>
                    <p className="mt-1 break-all text-sm text-gray-300">{administrator.email}</p>
                    <p className="mt-2 text-xs text-gray-500">
                        {administrator.hasPassword ? "Password has been set" : "Waiting for password setup"}
                        {" · "}Added {new Date(administrator.createdAt).toLocaleDateString("en-US", { timeZone: "UTC" })}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {administrator.active && (
                        <button
                            type="button"
                            disabled={isPending}
                            onClick={() => onSetupLink(administrator)}
                            className="rounded-lg border border-blue-500/30 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {administrator.hasPassword ? "Send Reset Link" : "Send Setup Link"}
                        </button>
                    )}

                    {administrator.active ? (
                        <button
                            type="button"
                            disabled={isPending || isCurrentAdministrator}
                            title={isCurrentAdministrator ? "You cannot deactivate your own account." : undefined}
                            onClick={() => onAccessChange(administrator, false)}
                            className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Deactivate
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled={isPending}
                            onClick={() => onAccessChange(administrator, true)}
                            className="rounded-lg border border-emerald-500/30 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Reactivate
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
}
