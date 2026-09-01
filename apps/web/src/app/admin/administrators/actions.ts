"use server";

import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { administratorInviteSchema, getAdministratorDeactivationError } from "@/lib/admin-management";
import { authOptions } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { isPasswordResetEmailConfigured, sendPasswordResetEmail } from "@/lib/email";
import { createPasswordResetToken } from "@/lib/password-reset";

export type AdministratorActionResult = {
    status: "idle" | "success" | "warning" | "error";
    message: string;
};

class AdministratorActionError extends Error {}

async function getActingAdministratorId() {
    const session = await getServerSession(authOptions);

    if (!(await canAccessAdmin(session)) || !session?.user?.id) {
        return null;
    }

    return session.user.id;
}

function firstValidationError(error: { issues: { message: string }[] }) {
    return error.issues[0]?.message || "Check the administrator details and try again.";
}

export async function createAdministrator(formData: FormData): Promise<AdministratorActionResult> {
    const actingAdministratorId = await getActingAdministratorId();

    if (!actingAdministratorId) {
        return { status: "error", message: "Your administrator session has expired. Please sign in again." };
    }

    const parsed = administratorInviteSchema.safeParse({
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
    });

    if (!parsed.success) {
        return { status: "error", message: firstValidationError(parsed.error) };
    }

    if (!isPasswordResetEmailConfigured()) {
        return { status: "error", message: "Password setup email is not configured. No administrator was added." };
    }

    const existingUser = await db.user.findFirst({
        where: { email: { equals: parsed.data.email, mode: "insensitive" } },
        select: { id: true },
    });

    if (existingUser) {
        return {
            status: "error",
            message: "That email already belongs to a user account. Open All User Accounts to change its role or status.",
        };
    }

    const reset = createPasswordResetToken();

    try {
        const administrator = await db.$transaction(async (transaction) => {
            const createdAdministrator = await transaction.user.create({
                data: {
                    firstName: parsed.data.firstName,
                    lastName: parsed.data.lastName,
                    email: parsed.data.email,
                    role: "ADMIN",
                    status: "APPROVED",
                    passwordHash: null,
                    resetToken: reset.tokenHash,
                    resetTokenExpiry: reset.expiresAt,
                },
                select: { id: true, email: true },
            });

            await transaction.auditLog.create({
                data: {
                    actorUserId: actingAdministratorId,
                    action: "ADMINISTRATOR_CREATED",
                    entityType: "USER",
                    entityId: createdAdministrator.id,
                    metadata: { email: createdAdministrator.email },
                },
            });

            return createdAdministrator;
        });

        try {
            await sendPasswordResetEmail(administrator.email, reset.token);
            await db.auditLog.create({
                data: {
                    actorUserId: actingAdministratorId,
                    action: "ADMINISTRATOR_SETUP_EMAIL_SENT",
                    entityType: "USER",
                    entityId: administrator.id,
                    metadata: { email: administrator.email },
                },
            });
        } catch {
            await db.user.update({
                where: { id: administrator.id },
                data: { resetToken: null, resetTokenExpiry: null },
            });
            revalidatePath("/admin/administrators");
            return {
                status: "warning",
                message: "The administrator was added, but the setup email could not be delivered. Use Send setup link to try again.",
            };
        }

        revalidatePath("/admin/administrators");
        return {
            status: "success",
            message: `Administrator added. A secure password setup link was emailed to ${administrator.email}.`,
        };
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return {
                status: "error",
                message: "That email already belongs to a user account. Open All User Accounts to change its role or status.",
            };
        }

        return { status: "error", message: "The administrator could not be added. Please try again." };
    }
}

export async function sendAdministratorSetupLink(administratorId: string): Promise<AdministratorActionResult> {
    const actingAdministratorId = await getActingAdministratorId();

    if (!actingAdministratorId) {
        return { status: "error", message: "Your administrator session has expired. Please sign in again." };
    }

    if (!isPasswordResetEmailConfigured()) {
        return { status: "error", message: "Password setup email is not configured." };
    }

    const administrator = await db.user.findFirst({
        where: { id: administratorId, role: "ADMIN", status: "APPROVED" },
        select: { id: true, email: true },
    });

    if (!administrator) {
        return { status: "error", message: "That active administrator account could not be found." };
    }

    const reset = createPasswordResetToken();
    await db.user.update({
        where: { id: administrator.id },
        data: { resetToken: reset.tokenHash, resetTokenExpiry: reset.expiresAt },
    });

    try {
        await sendPasswordResetEmail(administrator.email, reset.token);
        await db.auditLog.create({
            data: {
                actorUserId: actingAdministratorId,
                action: "ADMINISTRATOR_SETUP_EMAIL_SENT",
                entityType: "USER",
                entityId: administrator.id,
                metadata: { email: administrator.email },
            },
        });
    } catch {
        await db.user.update({
            where: { id: administrator.id },
            data: { resetToken: null, resetTokenExpiry: null },
        });
        return { status: "error", message: "The setup email could not be delivered. Please try again." };
    }

    revalidatePath("/admin/administrators");
    return { status: "success", message: `A new one-hour setup link was sent to ${administrator.email}.` };
}

export async function setAdministratorActive(
    administratorId: string,
    active: boolean,
): Promise<AdministratorActionResult> {
    const actingAdministratorId = await getActingAdministratorId();

    if (!actingAdministratorId) {
        return { status: "error", message: "Your administrator session has expired. Please sign in again." };
    }

    try {
        const administrator = await db.$transaction(
            async (transaction) => {
                const targetAdministrator = await transaction.user.findFirst({
                    where: { id: administratorId, role: "ADMIN" },
                    select: { id: true, email: true, status: true },
                });

                if (!targetAdministrator) {
                    throw new AdministratorActionError("That administrator account could not be found.");
                }

                if (!active) {
                    const activeAdministratorCount = await transaction.user.count({
                        where: { role: "ADMIN", status: "APPROVED" },
                    });
                    const safeguardError = getAdministratorDeactivationError(
                        actingAdministratorId,
                        targetAdministrator.id,
                        activeAdministratorCount,
                    );

                    if (safeguardError) {
                        throw new AdministratorActionError(safeguardError);
                    }
                }

                const updatedAdministrator = await transaction.user.update({
                    where: { id: targetAdministrator.id },
                    data: active
                        ? { status: "APPROVED" }
                        : { status: "SUSPENDED", resetToken: null, resetTokenExpiry: null },
                    select: { id: true, email: true },
                });

                await transaction.auditLog.create({
                    data: {
                        actorUserId: actingAdministratorId,
                        action: active ? "ADMINISTRATOR_REACTIVATED" : "ADMINISTRATOR_DEACTIVATED",
                        entityType: "USER",
                        entityId: updatedAdministrator.id,
                        metadata: { email: updatedAdministrator.email },
                    },
                });

                return updatedAdministrator;
            },
            { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );

        revalidatePath("/admin/administrators");
        return {
            status: "success",
            message: `${administrator.email} is now ${active ? "active" : "deactivated"}.`,
        };
    } catch (error) {
        if (error instanceof AdministratorActionError) {
            return { status: "error", message: error.message };
        }

        return { status: "error", message: "The administrator access change could not be saved. Please try again." };
    }
}
