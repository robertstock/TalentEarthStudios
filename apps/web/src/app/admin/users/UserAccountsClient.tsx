"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useState, useTransition } from "react";

import {
    permanentlyDeleteUserAccount,
    updateUserAccountRole,
    updateUserAccountStatus,
    type UserAccountActionResult,
} from "./actions";
import {
    type UserAccountRole,
    type UserAccountStatus,
    userAccountStatuses,
} from "@/lib/user-account-management";

export type UserAccountSummary = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserAccountRole;
    status: UserAccountStatus;
    hasPassword: boolean;
    linkedHistoryCount: number;
    createdAt: string;
};

type UserAccountsClientProps = {
    users: UserAccountSummary[];
    currentAdministratorId: string;
    activeAdministratorCount: number;
};

const initialResult: UserAccountActionResult = { status: "idle", message: "" };

const statusLabels: Record<UserAccountStatus, string> = {
    DRAFT: "Draft",
    PENDING_REVIEW: "Pending Review",
    APPROVED: "Active / Approved",
    REJECTED: "Rejected",
    SUSPENDED: "Suspended",
};

export default function UserAccountsClient({
    users,
    currentAdministratorId,
    activeAdministratorCount,
}: UserAccountsClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<UserAccountActionResult>(initialResult);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<"ALL" | UserAccountRole>("ALL");
    const [statusFilter, setStatusFilter] = useState<"ALL" | UserAccountStatus>("ALL");
    const deferredSearch = useDeferredValue(search.trim().toLowerCase());

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            !deferredSearch ||
            `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(deferredSearch);
        const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
        const matchesStatus = statusFilter === "ALL" || user.status === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
    });

    function runAction(action: () => Promise<UserAccountActionResult>) {
        setResult(initialResult);
        startTransition(async () => {
            const response = await action();
            setResult(response);
            router.refresh();
        });
    }

    function handleRoleChange(user: UserAccountSummary, nextRole: UserAccountRole) {
        if (nextRole === user.role) return;

        const roleLabel = nextRole === "ADMIN" ? "Administrator" : "Talent";
        const confirmed = window.confirm(
            `Change ${user.firstName} ${user.lastName} to ${roleLabel}? Their access will change immediately.`,
        );
        if (!confirmed) return;

        runAction(() => updateUserAccountRole(user.id, nextRole));
    }

    function handleStatusChange(user: UserAccountSummary, nextStatus: UserAccountStatus) {
        if (nextStatus === user.status) return;

        const confirmed = window.confirm(
            `Change ${user.firstName} ${user.lastName} to ${statusLabels[nextStatus]}?`,
        );
        if (!confirmed) return;

        runAction(() => updateUserAccountStatus(user.id, nextStatus));
    }

    function handlePermanentDelete(user: UserAccountSummary) {
        const confirmation = window.prompt(
            `Permanently delete ${user.firstName} ${user.lastName} (${user.email})? This cannot be undone. Type DELETE to continue.`,
        );
        if (confirmation !== "DELETE") return;

        runAction(() => permanentlyDeleteUserAccount(user.id));
    }

    const resultStyles =
        result.status === "success"
            ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-200"
            : "border-red-500/40 bg-red-950/40 text-red-200";

    return (
        <main className="container mx-auto min-h-screen px-6 pb-16 pt-32 text-white">
            <div className="mb-8">
                <Link
                    href="/admin"
                    className="mb-4 flex w-fit items-center gap-2 text-sm text-gray-400 transition hover:text-white"
                >
                    <i className="ph ph-arrow-left" aria-hidden="true" /> Back to Dashboard
                </Link>
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">All User Accounts</h1>
                        <p className="mt-2 max-w-3xl text-sm text-gray-400">
                            Search every account, change roles and statuses, or remove an unused account.
                        </p>
                    </div>
                    <Link
                        href="/admin/administrators"
                        className="rounded-lg border border-blue-500/30 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/10"
                    >
                        Manage Administrators
                    </Link>
                </div>
            </div>

            {result.status !== "idle" && (
                <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${resultStyles}`} role="status">
                    {result.message}
                </div>
            )}

            <section className="mb-6 grid gap-4 rounded-xl border border-white/10 bg-white/5 p-5 md:grid-cols-[minmax(0,1fr)_220px_220px]">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Search name or email
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Start typing…"
                        className="mt-2 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-3 text-base normal-case tracking-normal text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500"
                    />
                </label>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Role
                    <select
                        value={roleFilter}
                        onChange={(event) => setRoleFilter(event.target.value as "ALL" | UserAccountRole)}
                        className="mt-2 w-full rounded-lg border border-white/15 bg-[#080d15] px-3 py-3 text-base normal-case tracking-normal text-white outline-none focus:border-blue-500"
                    >
                        <option value="ALL">All roles</option>
                        <option value="ADMIN">Administrators</option>
                        <option value="TALENT">Talent</option>
                    </select>
                </label>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Status
                    <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value as "ALL" | UserAccountStatus)}
                        className="mt-2 w-full rounded-lg border border-white/15 bg-[#080d15] px-3 py-3 text-base normal-case tracking-normal text-white outline-none focus:border-blue-500"
                    >
                        <option value="ALL">All statuses</option>
                        {userAccountStatuses.map((status) => (
                            <option key={status} value={status}>
                                {statusLabels[status]}
                            </option>
                        ))}
                    </select>
                </label>
            </section>

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-400">
                <p>
                    Showing {filteredUsers.length} of {users.length} account{users.length === 1 ? "" : "s"}
                </p>
                <p>Permanent deletion is available only for accounts with no linked work or audit history.</p>
            </div>

            <section className="space-y-4">
                {filteredUsers.map((user) => {
                    const isCurrentAdministrator = user.id === currentAdministratorId;
                    const isFinalActiveAdministrator =
                        user.role === "ADMIN" && user.status === "APPROVED" && activeAdministratorCount <= 1;
                    const canPermanentlyDelete =
                        !isCurrentAdministrator && !isFinalActiveAdministrator && user.linkedHistoryCount === 0;
                    const availableStatuses = user.role === "ADMIN"
                        ? userAccountStatuses.filter((status) => status === "APPROVED" || status === "SUSPENDED")
                        : userAccountStatuses;

                    return (
                        <article
                            key={user.id}
                            className="rounded-xl border border-white/10 bg-[#080d15]/80 p-5 [content-visibility:auto]"
                        >
                            <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
                                <div className="min-w-0 xl:w-1/3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-lg font-bold">
                                            {user.firstName} {user.lastName}
                                        </h2>
                                        {isCurrentAdministrator && (
                                            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-300">
                                                You
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 break-all text-sm text-gray-300">{user.email}</p>
                                    <p className="mt-2 text-xs text-gray-500">
                                        {user.hasPassword ? "Password set" : "Password setup pending"}
                                        {" · "}Added {new Date(user.createdAt).toLocaleDateString("en-US", { timeZone: "UTC" })}
                                        {user.linkedHistoryCount > 0 ? ` · ${user.linkedHistoryCount} linked record${user.linkedHistoryCount === 1 ? "" : "s"}` : " · No linked history"}
                                    </p>
                                </div>

                                <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:max-w-2xl">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Role
                                        <select
                                            value={user.role}
                                            disabled={isPending || isCurrentAdministrator}
                                            onChange={(event) => handleRoleChange(user, event.target.value as UserAccountRole)}
                                            className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#080d15] px-3 py-2.5 text-sm normal-case tracking-normal text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="TALENT">Talent</option>
                                            <option value="ADMIN">Administrator</option>
                                        </select>
                                    </label>
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Status
                                        <select
                                            value={user.status}
                                            disabled={isPending || isCurrentAdministrator}
                                            onChange={(event) => handleStatusChange(user, event.target.value as UserAccountStatus)}
                                            className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#080d15] px-3 py-2.5 text-sm normal-case tracking-normal text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {availableStatuses.map((status) => (
                                                <option key={status} value={status}>
                                                    {statusLabels[status]}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>

                                <button
                                    type="button"
                                    disabled={isPending || !canPermanentlyDelete}
                                    title={
                                        isCurrentAdministrator
                                            ? "You cannot delete your own account."
                                            : isFinalActiveAdministrator
                                              ? "The final active administrator cannot be deleted."
                                              : user.linkedHistoryCount > 0
                                                ? "This account has linked history. Suspend it instead."
                                                : undefined
                                    }
                                    onClick={() => handlePermanentDelete(user)}
                                    className="rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-35"
                                >
                                    Permanently Delete
                                </button>
                            </div>
                        </article>
                    );
                })}

                {filteredUsers.length === 0 && (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center text-gray-500">
                        No accounts match those filters.
                    </div>
                )}
            </section>
        </main>
    );
}
