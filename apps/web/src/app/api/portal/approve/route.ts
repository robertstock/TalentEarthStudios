import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const { sowId, projectId } = await req.json();

        if (!sowId || !projectId) {
            return NextResponse.json({ error: "Missing identity params" }, { status: 400 });
        }

        // 1. Move SOW to PUBLISHED
        await db.sOW.update({
            where: { id: sowId },
            data: { status: "PUBLISHED" }
        });

        // 2. Log ClientResponse
        await db.clientResponse.create({
            data: {
                sowId: sowId,
                responseType: "APPROVED",
                comments: "Electronically approved via Secure Portal."
            }
        });

        // 3. Move Project state to APPROVED_FOR_SOW 
        // (which acts as 'Awaiting Talent Routing' in our flow)
        await db.project.update({
            where: { id: projectId },
            data: { status: "APPROVED_FOR_SOW" }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Portal Approval Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
