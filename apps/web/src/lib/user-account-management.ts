export const userAccountRoles = ["TALENT", "ADMIN"] as const;
export const userAccountStatuses = ["DRAFT", "PENDING_REVIEW", "APPROVED", "REJECTED", "SUSPENDED"] as const;

export type UserAccountRole = (typeof userAccountRoles)[number];
export type UserAccountStatus = (typeof userAccountStatuses)[number];

export function isStatusAllowedForRole(role: UserAccountRole, status: UserAccountStatus) {
    if (role === "ADMIN") {
        return status === "APPROVED" || status === "SUSPENDED";
    }

    return true;
}

export function getProtectedAdministratorChangeError({
    actingAdministratorId,
    targetUserId,
    targetRole,
    targetStatus,
    activeAdministratorCount,
}: {
    actingAdministratorId: string;
    targetUserId: string;
    targetRole: UserAccountRole;
    targetStatus: UserAccountStatus;
    activeAdministratorCount: number;
}) {
    if (targetRole !== "ADMIN") {
        return null;
    }

    if (actingAdministratorId === targetUserId) {
        return "You cannot remove or reduce access to your own administrator account.";
    }

    if (targetStatus === "APPROVED" && activeAdministratorCount <= 1) {
        return "At least one active administrator account is required.";
    }

    return null;
}

export function getPermanentDeletionError({
    actingAdministratorId,
    targetUserId,
    targetRole,
    targetStatus,
    activeAdministratorCount,
    linkedHistoryCount,
}: {
    actingAdministratorId: string;
    targetUserId: string;
    targetRole: UserAccountRole;
    targetStatus: UserAccountStatus;
    activeAdministratorCount: number;
    linkedHistoryCount: number;
}) {
    const administratorProtectionError = getProtectedAdministratorChangeError({
        actingAdministratorId,
        targetUserId,
        targetRole,
        targetStatus,
        activeAdministratorCount,
    });

    if (administratorProtectionError) {
        return administratorProtectionError;
    }

    if (linkedHistoryCount > 0) {
        return "This account has linked work or audit history. Change its status to Suspended instead.";
    }

    return null;
}
