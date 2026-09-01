import crypto from "node:crypto";

export const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000;

export function normalizeAccountEmail(email: string) {
    return email.trim().toLowerCase();
}

export function hashPasswordResetToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

export function createPasswordResetToken(now = Date.now()) {
    const token = crypto.randomBytes(32).toString("hex");

    return {
        token,
        tokenHash: hashPasswordResetToken(token),
        expiresAt: new Date(now + PASSWORD_RESET_EXPIRY_MS),
    };
}
