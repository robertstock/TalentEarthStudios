import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const systemAdmin = await db.user.upsert({
            where: { email: "finley@talentearth.com" },
            update: { role: "ADMIN" },
            create: {
                email: "finley@talentearth.com",
                firstName: "Finley",
                lastName: "System",
                role: "ADMIN",
                status: "APPROVED"
            }
        });

        let client = await db.client.findFirst({ where: { email: "robertstock@me.com" } });
        if (!client) {
            client = await db.client.create({
                data: {
                    companyName: "Personal Project",
                    primaryContactName: "Robert Stock",
                    email: "robertstock@me.com",
                }
            });
        }

        const project = await db.project.create({
            data: {
                name: "Interactive Trade Show Display - Experiential",
                description: "A custom 10x10 booth with screens and LED.",
                budgetRange: "$25,000 to $40,000",
                timeline: "8 weeks",
                clientId: client.id,
                createdById: systemAdmin.id,
                status: "SOW_DRAFT",
                aiConfidenceScore: 92,
                urgencyScore: 80,
                complexityScore: 75,
                isAutoRouted: true,
                requiresRpmReview: false,
                exceptionReason: "None",
            }
        });

        const shareToken = "test-token-" + project.id;
        
        await db.sOW.create({
            data: {
                projectId: project.id,
                versionNumber: 1,
                status: "DRAFT",
                bodyRichText: "## Project Summary\nA custom trade show booth for TalentEarthStudios.\n\n## Deliverables\n- Concept renderings\n- Engineering drawings\n- Fabrication\n- Packaging\n\n## Notes\nAll standard variables present.",
                createdById: systemAdmin.id,
                shareToken: shareToken,
            }
        });

        return NextResponse.json({ success: true, project });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
