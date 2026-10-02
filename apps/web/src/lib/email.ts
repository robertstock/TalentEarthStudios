import { Resend } from "resend";

const DEFAULT_PROJECT_REQUEST_NOTIFICATION_EMAIL = "robertstock@me.com";
const DEFAULT_FROM_EMAIL = "TalentEarth Studios <no-reply@talentearth.com>";

export interface ProjectRequestNotificationDetails {
    requestId: string;
    projectName: string;
    clientName?: string | null;
    contactName?: string | null;
    contactEmail?: string | null;
    projectType?: string | null;
    timeline?: string | null;
    budgetRange?: string | null;
    description?: string | null;
    status?: string | null;
    dashboardPath?: string;
    projectId?: string | null;
}

function escapeHtml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function normalizeSubjectText(value: string) {
    return value.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

function humanizeStatus(value: string) {
    return value
        .toLowerCase()
        .split("_")
        .filter(Boolean)
        .map((word) => `${word[0]?.toUpperCase() || ""}${word.slice(1)}`)
        .join(" ");
}

function getAppUrl() {
    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;

    if (configuredUrl) {
        try {
            return new URL(configuredUrl).origin;
        } catch {
            console.warn("Invalid application URL configured for project request emails; using localhost.");
        }
    }

    return "http://localhost:3000";
}

function isEmailAddress(value: string | null | undefined): value is string {
    return Boolean(value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
}

export function buildProjectRequestNotificationEmail(
    details: ProjectRequestNotificationDetails,
    appUrl = getAppUrl(),
) {
    const dashboardUrl = new URL(details.dashboardPath || "/admin/projects", `${appUrl}/`);
    if (details.projectId) {
        dashboardUrl.searchParams.set("project", details.projectId);
    }

    const projectName = normalizeSubjectText(details.projectName) || "Untitled project";
    const rows = [
        ["Client", details.clientName],
        ["Contact", details.contactName],
        ["Email", details.contactEmail],
        ["Project type", details.projectType],
        ["Timeline", details.timeline],
        ["Budget", details.budgetRange],
        ["Status", details.status ? humanizeStatus(details.status) : null],
    ].filter((row): row is [string, string] => Boolean(row[1]?.trim()));

    const detailRowsHtml = rows.map(([label, value]) => `
        <tr>
            <td style="padding: 8px 16px 8px 0; color: #64748b; font-size: 13px; vertical-align: top; white-space: nowrap;">${escapeHtml(label)}</td>
            <td style="padding: 8px 0; color: #0f172a; font-size: 14px; font-weight: 600; vertical-align: top;">${escapeHtml(value)}</td>
        </tr>`).join("");
    const textRows = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
    const submittedDescription = details.description?.trim();
    const description = submittedDescription && submittedDescription.length > 4000
        ? `${submittedDescription.slice(0, 3999)}…`
        : submittedDescription;
    const safeDescription = description ? escapeHtml(description) : null;

    return {
        dashboardUrl: dashboardUrl.toString(),
        subject: `New project request: ${projectName}`.slice(0, 180),
        html: `
            <!doctype html>
            <html lang="en">
                <body style="margin: 0; padding: 0; background: #f1f5f9; font-family: Arial, sans-serif; color: #0f172a;">
                    <div style="max-width: 620px; margin: 0 auto; padding: 32px 16px;">
                        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px;">
                            <p style="margin: 0 0 12px; color: #2563eb; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;">New project request</p>
                            <h1 style="margin: 0 0 24px; color: #0f172a; font-size: 26px; line-height: 1.25;">${escapeHtml(projectName)}</h1>
                            ${detailRowsHtml ? `<table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">${detailRowsHtml}</table>` : ""}
                            ${safeDescription ? `
                                <div style="margin: 0 0 28px; padding: 18px; background: #f8fafc; border-radius: 8px;">
                                    <p style="margin: 0 0 8px; color: #64748b; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">Project brief</p>
                                    <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${safeDescription}</p>
                                </div>` : ""}
                            <p style="margin: 0 0 28px;">
                                <a href="${escapeHtml(dashboardUrl.toString())}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 18px; border-radius: 7px; text-decoration: none; font-size: 14px; font-weight: 700;">Review in dashboard</a>
                            </p>
                            <p style="margin: 0; color: #94a3b8; font-size: 11px;">Request ID: ${escapeHtml(details.requestId)}</p>
                        </div>
                    </div>
                </body>
            </html>`,
        text: [
            "New project request",
            "",
            projectName,
            textRows,
            description ? `Project brief: ${description}` : "",
            "",
            `Review in dashboard: ${dashboardUrl.toString()}`,
            `Request ID: ${details.requestId}`,
        ].filter((line, index, lines) => line || (index > 0 && lines[index - 1] !== "")).join("\n"),
    };
}

export async function sendProjectRequestNotification(details: ProjectRequestNotificationDetails, idempotencyKey?: string) {
    if (!process.env.RESEND_API_KEY) {
        console.warn(`RESEND_API_KEY is missing; project request email was not sent for ${details.requestId}.`);
        return false;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const email = buildProjectRequestNotificationEmail(details);

    try {
        const payload = {
            from: process.env.PROJECT_REQUEST_FROM_EMAIL || process.env.PASSWORD_RESET_FROM_EMAIL || DEFAULT_FROM_EMAIL,
            to: process.env.PROJECT_REQUEST_NOTIFICATION_EMAIL || DEFAULT_PROJECT_REQUEST_NOTIFICATION_EMAIL,
            reply_to: isEmailAddress(details.contactEmail) ? details.contactEmail : undefined,
            subject: email.subject,
            html: email.html,
            text: email.text,
        };
        // The installed Resend SDK predates idempotency support; use its REST API for mobile retries.
        const result = idempotencyKey
            ? await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
                body: JSON.stringify(payload), signal: AbortSignal.timeout(15_000),
            }).then(async response => response.ok ? { error: null } : { error: { message: `Email provider returned ${response.status}` } })
            : await resend.emails.send(payload);
        const { error } = result;

        if (error) {
            throw new Error(error.message);
        }

        return true;
    } catch (error) {
        console.error(`Failed to send project request email for ${details.requestId}:`, error);
        return false;
    }
}

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
