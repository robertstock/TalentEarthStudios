import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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

        return NextResponse.json({ success: true, id: lead.id });
    } catch (error) {
        console.error("Lead Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
