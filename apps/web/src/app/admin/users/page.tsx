import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import UserAccountsClient, { type UserAccountSummary } from "./UserAccountsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UserAccountsPage() {
    const session = await getServerSession(authOptions);

    if (!(await canAccessAdmin(session)) || !session?.user?.id) {
        redirect("/app");
    }

    const userRecords = await db.user.findMany({
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            status: true,
            passwordHash: true,
            createdAt: true,
            _count: {
                select: {
                    portfolio: true,
                    ledTeams: true,
                    projectsCreated: true,
                    assignedProjects: true,
                    submittedQuotes: true,
                    auditLogs: true,
                    recordingConsents: true,
                    reviews: true,
                    sowsCreated: true,
                },
            },
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }, { email: "asc" }],
    });

    const activeAdministratorCount = userRecords.filter(
        (user) => user.role === "ADMIN" && user.status === "APPROVED",
    ).length;

    const users: UserAccountSummary[] = userRecords.map((user) => {
        const linkedHistoryCount = Object.values(user._count).reduce((total, count) => total + count, 0);

        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            status: user.status,
            hasPassword: Boolean(user.passwordHash),
            linkedHistoryCount,
            createdAt: user.createdAt.toISOString(),
        };
    });

    return (
        <UserAccountsClient
            users={users}
            currentAdministratorId={session.user.id}
            activeAdministratorCount={activeAdministratorCount}
        />
    );
}
