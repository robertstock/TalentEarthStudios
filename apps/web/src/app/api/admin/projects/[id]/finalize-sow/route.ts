import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { recipientEmail, ccRPM, teamId, talentId, bodyRichText } = body;

        // Update SOW status and content
        // We assume the latest SOW or find by ID if we had it, but here we can just find the latest draft for this project
        const sow = await db.sOW.findFirst({
            where: { projectId: id },
            orderBy: { createdAt: 'desc' }
        });

        if (sow) {
            const sowUpdateData: any = {
                status: 'PUBLISHED',
                bodyRichText: bodyRichText || sow.bodyRichText,
            };

            // Only assign if it's a valid ID for the respective relation
            // talentId in request is actually a User ID
            if (teamId) {
                sowUpdateData.teamId = teamId;
                sowUpdateData.talentId = null;
            } else {
                sowUpdateData.teamId = null;
                sowUpdateData.talentId = null; // No direct User relation on SOW
            }

            await db.sOW.update({
                where: { id: sow.id },
                data: sowUpdateData
            });
        }

        // Update Project status and assignments
        const projectUpdateData: any = {
            status: 'SENT',
        };

        if (teamId) {
            projectUpdateData.assignedType = 'TEAM';
            projectUpdateData.assignedTeamId = teamId;
            projectUpdateData.teamId = teamId; // Legacy/Redundant field
            projectUpdateData.assignedUserId = null;
            projectUpdateData.talentId = null;
        } else if (talentId) {
            projectUpdateData.assignedType = 'INDIVIDUAL';
            projectUpdateData.assignedUserId = talentId; // talentId is the User ID
            projectUpdateData.assignedTeamId = null;
            projectUpdateData.teamId = null;
            projectUpdateData.talentId = null; // talentId field is for Talent model, not User
        }

        await db.project.update({
            where: { id },
            data: projectUpdateData
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("FINALIZE_SOW_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
