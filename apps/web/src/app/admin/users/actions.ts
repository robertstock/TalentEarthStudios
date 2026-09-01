"use server";

import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import {
    getPermanentDeletionError,
    getProtectedAdministratorChangeError,
    isStatusAllowedForRole,
    type UserAccountRole,
    type UserAccountStatus,
    userAccountRoles,
    userAccountStatuses,
} from "@/lib/user-account-management";

export type UserAccountActionResult = {
    status: "idle" | "success" | "error";
    message: string;
};

class UserAccountActionError extends Error {}

async function getActingAdministratorId() {
    const session = await getServerSession(authOptions);

    if (!(await canAccessAdmin(session)) || !session?.user?.id) {
        return null;
    }

    return session.user.id;
}

function isUserAccountRole(value: string): value is UserAccountRole {
    return userAccountRoles.some((role) => role === value);
}

function isUserAccountStatus(value: string): value is UserAccountStatus {
    return userAccountStatuses.some((status) => status === value);
}

function revalidateUserAccountPages() {
    revalidatePath("/admin");
    revalidatePath("/admin/users");
    revalidatePath("/admin/administrators");
    revalidatePath("/admin/talent");
}

export async function updateUserAccountStatus(
    userId: string,
    nextStatusValue: string,
): Promise<UserAccountActionResult> {
    const actingAdministratorId = await getActingAdministratorId();

    if (!actingAdministratorId) {
        return { status: "error", message: "Your administrator session has expired. Please sign in again." };
    }

    if (!isUserAccountStatus(nextStatusValue)) {
        return { status: "error", message: "Choose a valid account status." };
    }

    try {
        const updatedUser = await db.$transaction(
            async (transaction) => {
                const targetUser = await transaction.user.findUnique({
                    where: { id: userId },
                    select: { id: true, email: true, role: true, status: true },
                });

                if (!targetUser) {
                    throw new UserAccountActionError("That user account could not be found.");
                }

                if (!isStatusAllowedForRole(targetUser.role, nextStatusValue)) {
                    throw new UserAccountActionError("Administrator accounts can only be Active or Suspended.");
                }

                if (targetUser.status === nextStatusValue) {
                    return targetUser;
                }

                if (targetUser.role === "ADMIN" && nextStatusValue !== "APPROVED") {
                    const activeAdministratorCount = await transaction.user.count({
                        where: { role: "ADMIN", status: "APPROVED" },
                    });
                    const safeguardError = getProtectedAdministratorChangeError({
                        actingAdministratorId,
                        targetUserId: targetUser.id,
                        targetRole: targetUser.role,
                        targetStatus: targetUser.status,
                        activeAdministratorCount,
                    });

                    if (safeguardError) {
                        throw new UserAccountActionError(safeguardError);
                    }
                }

                const updatedAccount = await transaction.user.update({
                    where: { id: targetUser.id },
                    data: {
                        status: nextStatusValue,
                        ...(nextStatusValue === "SUSPENDED" || nextStatusValue === "REJECTED"
                            ? { resetToken: null, resetTokenExpiry: null }
                            : {}),
                    },
                    select: { id: true, email: true, role: true, status: true },
                });

                await transaction.auditLog.create({
                    data: {
                        actorUserId: actingAdministratorId,
                        action: "USER_ACCOUNT_STATUS_CHANGED",
                        entityType: "USER",
                        entityId: targetUser.id,
                        metadata: {
                            email: targetUser.email,
                            fromStatus: targetUser.status,
                            toStatus: nextStatusValue,
                            role: targetUser.role,
                        },
                    },
                });

                return updatedAccount;
            },
            { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );

        revalidateUserAccountPages();
        return { status: "success", message: `${updatedUser.email} is now ${updatedUser.status.toLowerCase().replaceAll("_", " ")}.` };
    } catch (error) {
        if (error instanceof UserAccountActionError) {
            return { status: "error", message: error.message };
        }

        return { status: "error", message: "The account status could not be changed. Please try again." };
    }
}

export async function updateUserAccountRole(
    userId: string,
    nextRoleValue: string,
): Promise<UserAccountActionResult> {
    const actingAdministratorId = await getActingAdministratorId();

    if (!actingAdministratorId) {
        return { status: "error", message: "Your administrator session has expired. Please sign in again." };
    }

    if (!isUserAccountRole(nextRoleValue)) {
        return { status: "error", message: "Choose a valid account role." };
    }

    try {
        const updatedUser = await db.$transaction(
            async (transaction) => {
                const targetUser = await transaction.user.findUnique({
                    where: { id: userId },
                    select: { id: true, email: true, role: true, status: true },
                });

                if (!targetUser) {
                    throw new UserAccountActionError("That user account could not be found.");
                }

                if (targetUser.role === nextRoleValue) {
                    return targetUser;
                }

                if (targetUser.role === "ADMIN") {
                    const activeAdministratorCount = await transaction.user.count({
                        where: { role: "ADMIN", status: "APPROVED" },
                    });
                    const safeguardError = getProtectedAdministratorChangeError({
                        actingAdministratorId,
                        targetUserId: targetUser.id,
                        targetRole: targetUser.role,
                        targetStatus: targetUser.status,
                        activeAdministratorCount,
                    });

                    if (safeguardError) {
                        throw new UserAccountActionError(safeguardError);
                    }
                }

                const nextStatus: UserAccountStatus = nextRoleValue === "ADMIN" ? "APPROVED" : targetUser.status;
                const updatedAccount = await transaction.user.update({
                    where: { id: targetUser.id },
                    data: { role: nextRoleValue, status: nextStatus },
                    select: { id: true, email: true, role: true, status: true },
                });

                await transaction.auditLog.create({
                    data: {
                        actorUserId: actingAdministratorId,
                        action: "USER_ACCOUNT_ROLE_CHANGED",
                        entityType: "USER",
                        entityId: targetUser.id,
                        metadata: {
                            email: targetUser.email,
                            fromRole: targetUser.role,
                            toRole: nextRoleValue,
                            status: nextStatus,
                        },
                    },
                });

                return updatedAccount;
            },
            { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );

        revalidateUserAccountPages();
        return {
            status: "success",
            message: `${updatedUser.email} is now ${updatedUser.role === "ADMIN" ? "an administrator" : "a talent user"}.`,
        };
    } catch (error) {
        if (error instanceof UserAccountActionError) {
            return { status: "error", message: error.message };
        }

        return { status: "error", message: "The account role could not be changed. Please try again." };
    }
}

export async function permanentlyDeleteUserAccount(userId: string): Promise<UserAccountActionResult> {
    const actingAdministratorId = await getActingAdministratorId();

    if (!actingAdministratorId) {
        return { status: "error", message: "Your administrator session has expired. Please sign in again." };
    }

    try {
        const deletedUser = await db.$transaction(
            async (transaction) => {
                const targetUser = await transaction.user.findUnique({
                    where: { id: userId },
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        status: true,
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
                });

                if (!targetUser) {
                    throw new UserAccountActionError("That user account could not be found.");
                }

                const activeAdministratorCount = await transaction.user.count({
                    where: { role: "ADMIN", status: "APPROVED" },
                });
                const linkedHistoryCount = Object.values(targetUser._count).reduce((total, count) => total + count, 0);
                const deletionError = getPermanentDeletionError({
                    actingAdministratorId,
                    targetUserId: targetUser.id,
                    targetRole: targetUser.role,
                    targetStatus: targetUser.status,
                    activeAdministratorCount,
                    linkedHistoryCount,
                });

                if (deletionError) {
                    throw new UserAccountActionError(deletionError);
                }

                await transaction.notification.deleteMany({ where: { userId: targetUser.id } });
                await transaction.user.delete({ where: { id: targetUser.id } });
                await transaction.auditLog.create({
                    data: {
                        actorUserId: actingAdministratorId,
                        action: "USER_ACCOUNT_PERMANENTLY_DELETED",
                        entityType: "USER",
                        entityId: targetUser.id,
                        metadata: { email: targetUser.email, role: targetUser.role, status: targetUser.status },
                    },
                });

                return targetUser;
            },
            { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );

        revalidateUserAccountPages();
        return { status: "success", message: `${deletedUser.email} was permanently deleted.` };
    } catch (error) {
        if (error instanceof UserAccountActionError) {
            return { status: "error", message: error.message };
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
            return {
                status: "error",
                message: "This account is linked to business records and cannot be deleted. Suspend it instead.",
            };
        }

        return { status: "error", message: "The account could not be deleted. Please try again." };
    }
}
