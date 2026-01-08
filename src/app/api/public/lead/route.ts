import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Resend } from "resend";

// Initialize Resend lazily or safely
const resend = new Resend(process.env.RESEND_API_KEY || "re_123456789");

// Simple in-memory rate limit for demo
const rateLimits = new Map<string, number>();

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for") || "unknown";
        const now = Date.now();

        // Rate limit: 1 request per 10 seconds per IP
        const lastRequest = rateLimits.get(ip);
        if (lastRequest && now - lastRequest < 10000) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }
        rateLimits.set(ip, now);

        const body = await req.json();
        const { name, email, company, message, talentSlug, teamSlug } = body;

        if (!name || !email || !message) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const lead = await db.lead.create({
            data: {
                name,
                email,
                company,
                message,
                talentSlug,
                teamSlug
            }
        });

        // Send email notification (fire and forget to not block response)
        try {
            if (process.env.RESEND_API_KEY) {
                await resend.emails.send({
                    from: 'TalentEarth <onboarding@resend.dev>', // Should be a verified domain in prod
                    to: 'robert@talentearth.com',
                    subject: 'New Project Request',
                    html: `
                        <h1>New Project Request</h1>
                        <p><strong>From:</strong> ${name} (${email})</p>
                        <p><strong>Company:</strong> ${company || "N/A"}</p>
                        <hr />
                        <h3>Message/Scope:</h3>
                        <pre style="font-family: sans-serif; white-space: pre-wrap;">${message}</pre>
                        <p>
                            <a href="${process.env.NEXTAUTH_URL}/app/requests">View in Dashboard</a>
                        </p>
                    `
                });
            } else {
                console.warn("RESEND_API_KEY is missing, skipping email.");
            }
        } catch (emailError) {
            console.error("Failed to send notification email:", emailError);
            // Don't fail the request if email fails
        }

        return NextResponse.json({ success: true, id: lead.id });
    } catch (error) {
        console.error("Lead Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
