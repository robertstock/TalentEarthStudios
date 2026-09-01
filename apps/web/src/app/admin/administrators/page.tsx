import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import AdminManagementClient, { type AdministratorSummary } from "./AdminManagementClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdministratorsPage() {
    const session = await getServerSession(authOptions);

    if (!(await canAccessAdmin(session)) || !session?.user?.id) {
        redirect("/app");
    }

    const administratorRecords = await db.user.findMany({
        where: { role: "ADMIN" },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
            passwordHash: true,
            createdAt: true,
        },
        orderBy: [{ status: "asc" }, { firstName: "asc" }, { lastName: "asc" }],
    });

    const administrators: AdministratorSummary[] = administratorRecords.map((administrator) => ({
        id: administrator.id,
        firstName: administrator.firstName,
        lastName: administrator.lastName,
        email: administrator.email,
        active: administrator.status === "APPROVED",
        hasPassword: Boolean(administrator.passwordHash),
        createdAt: administrator.createdAt.toISOString(),
    }));

    return (
        <AdminManagementClient
            administrators={administrators}
            currentAdministratorId={session.user.id}
        />
    );
}
