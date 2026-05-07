import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// In production on Vercel, secure this endpoint via Headers verification or Vercel Cron.
export async function GET(req: NextRequest) {
    try {
        // Find projects that have been stuck in DRAFT or SOW_DRAFT for more than 48 hours
        // OR projects in APPROVED_FOR_SOW that haven't advanced to SUBMITTED
        
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

        const staleProjects = await db.project.findMany({
            where: {
                status: {
                    in: ["DRAFT", "SOW_DRAFT", "APPROVED_FOR_SOW", "AWAITING_CLIENT"]
                },
                updatedAt: {
                    lt: fortyEightHoursAgo
                },
                requiresRpmReview: false // only grab those not already flagged
            }
        });

        if (staleProjects.length === 0) {
            return NextResponse.json({ success: true, escalatedCount: 0, message: "No stale projects found." });
        }

        // Flag them for RPM Review
        const projectIds = staleProjects.map(p => p.id);
        
        await db.project.updateMany({
            where: { id: { in: projectIds } },
            data: {
                requiresRpmReview: true,
                exceptionReason: "System Escalation: Project stalled in current pipeline stage for > 48 hours."
            }
        });

        // Trigger Notification Logic (Twilio/Resend) for RPM mapping
        // e.g. await sendAdminAlert("Escalations Triggered", projectIds);

        return NextResponse.json({ success: true, escalatedCount: staleProjects.length, escalatedIds: projectIds });

    } catch (error) {
        console.error("Cron Health Check Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
