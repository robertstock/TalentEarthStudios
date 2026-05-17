import { db } from "@/lib/db";
import DashboardClient, { DashboardProject, ProjectHealth } from "./DashboardClient";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/auth-guards";

// Revalidate occasionally, or rely on client-side router refreshes
export const revalidate = 0; 

function calculateDerivedHealth(project: any): ProjectHealth {
    if (project.requiresRpmReview) return "Yellow";
    if (project.status === "CLOSED" || project.status === "APPROVED_FOR_SOW") return "Green";
    
    // Simplistic heuristic: if low confidence, it's yellow
    if (project.aiConfidenceScore && project.aiConfidenceScore < 70) return "Yellow";
    
    // Just default Green for active good ones
    return "Green";
}

function calculateProgress(status: string): number {
    switch(status) {
        case "DRAFT": return 10;
        case "SOW_DRAFT": return 25;
        case "SENT": return 30;
        case "QUOTE_RECEIVED": return 50;
        case "APPROVED_FOR_SOW": return 75;
        case "SUBMITTED": return 90;
        case "CLOSED": return 100;
        default: return 20;
    }
}

export default async function AdminProjectsPage() {
    const session = await getServerSession(authOptions);

    if (!canAccessAdmin(session)) {
        redirect("/app");
    }

    const rawProjects = await db.project.findMany({
        include: {
            client: true,
            team: {
                include: { members: { include: { user: true } } }
            },
            talent: true,
            sows: {
                orderBy: { createdAt: 'desc' },
                take: 1
            },
            vendorBills: true,
            invoice: true,
        },
        orderBy: { updatedAt: "desc" }
    });

    const formattedProjects: DashboardProject[] = rawProjects.map(p => {
        let teamMembers: { name: string; role: string; avatar: string }[] = [];
        
        if (p.team && p.team.members) {
            teamMembers = p.team.members.map(m => ({
                name: `${m.user?.firstName || ''} ${m.user?.lastName || ''}`.trim(),
                role: m.roleInTeam || "Member",
                avatar: `${m.user?.firstName?.[0] || ''}${m.user?.lastName?.[0] || ''}`.toUpperCase()
            }));
        } else if (p.talent) {
            teamMembers = [{
                name: p.talent.name,
                role: "Lead Talent",
                avatar: `${p.talent.name?.[0] || ''}`.toUpperCase()
            }];
        }

        const latestSow = p.sows.length > 0 ? p.sows[0].bodyRichText : null;
        const parsedSowParagraphs = latestSow ? latestSow.split("\\n\\n").filter(Boolean) : [];

        return {
            id: p.id,
            name: p.name,
            client: p.client?.companyName || "Unknown Client",
            status: p.status,
            health: calculateDerivedHealth(p),
            progress: calculateProgress(p.status),
            dueDate: p.timeline || "TBD",
            isAutoRouted: p.isAutoRouted,
            requiresRpmReview: p.requiresRpmReview,
            aiConfidenceScore: p.aiConfidenceScore || 0,
            teamMembers,
            sow: parsedSowParagraphs,
            budgetRange: p.budgetRange || "Pending",
            vendorBills: p.vendorBills || [],
            invoice: p.invoice || null,
        };
    });

    return <DashboardClient projects={formattedProjects} />;
}
