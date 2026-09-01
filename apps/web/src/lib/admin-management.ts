import { z } from "zod";

const administratorNameSchema = z
    .string()
    .trim()
    .min(1, "Enter a name.")
    .max(80, "Names must be 80 characters or fewer.");

export const administratorInviteSchema = z.object({
    firstName: administratorNameSchema,
    lastName: administratorNameSchema,
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Enter a valid email address.")
        .max(254, "Email addresses must be 254 characters or fewer."),
});

export function getAdministratorDeactivationError(
    actorAdministratorId: string,
    targetAdministratorId: string,
    activeAdministratorCount: number,
) {
    if (actorAdministratorId === targetAdministratorId) {
        return "You cannot deactivate your own administrator account.";
    }

    if (activeAdministratorCount <= 1) {
        return "At least one active administrator account is required.";
    }

    return null;
}
