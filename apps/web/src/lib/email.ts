import { Resend } from "resend";

export function isPasswordResetEmailConfigured() {
    return Boolean(process.env.RESEND_API_KEY || process.env.MAKE_WEBHOOK_URL);
}

export async function sendPasswordResetEmail(email: string, token: string) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetLink = `${appUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;

    if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { error } = await resend.emails.send({
            from: process.env.PASSWORD_RESET_FROM_EMAIL || "TalentEarth Studios <no-reply@talentearth.com>",
            to: email,
            subject: "Set up or reset your TalentEarth Studios password",
            html: `
                <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6; max-width: 560px; margin: 0 auto;">
                    <h1 style="font-size: 24px;">Choose your password</h1>
                    <p>Use the secure link below to set up or reset your TalentEarth Studios password. This link expires in one hour and can only be used once.</p>
                    <p style="margin: 28px 0;">
                        <a href="${resetLink}" style="background: #2563eb; color: #ffffff; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">Choose a new password</a>
                    </p>
                    <p style="font-size: 13px; color: #6b7280;">If you did not request this, you can safely ignore this email.</p>
                </div>
            `,
        });

        if (error) {
            throw new Error(`Resend delivery failed: ${error.message}`);
        }
        return;
    }

    if (process.env.MAKE_WEBHOOK_URL) {
        const response = await fetch(process.env.MAKE_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "PASSWORD_RESET",
                email,
                resetLink,
                timestamp: new Date().toISOString(),
            }),
        });

        if (!response.ok) {
            throw new Error(`Password reset webhook failed with status ${response.status}`);
        }
        return;
    }

    throw new Error("Password reset email is not configured");
}
