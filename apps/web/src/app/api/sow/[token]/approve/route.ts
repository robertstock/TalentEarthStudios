import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;
        const body = await req.json();
        const { decision, comments } = body; // decision = "APPROVED" | "REVISION_REQUESTED"

        if (!decision) {
            return NextResponse.json({ message: "Missing decision" }, { status: 400 });
        }

        const sow = await db.sOW.findUnique({
            where: { shareToken: token },
            include: { project: true }
        });

        if (!sow) {
            return NextResponse.json({ message: "Invalid SOW link" }, { status: 404 });
        }

        // Record the client response
        await db.clientResponse.create({
            data: {
                sowId: sow.id,
                responseType: decision,
                comments: comments || null
            }
        });

        // Update Project Status
        if (decision === "APPROVED") {
            await db.project.update({
                where: { id: sow.projectId },
                data: { status: 'APPROVED_FOR_SOW' } // Moving it forward
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("APPROVE_SOW_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
