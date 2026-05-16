import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/auth-guards";
import IncomingClient, { IncomingProject } from "./IncomingClient";

export const revalidate = 0; 

export default async function AdminIncomingPage() {
    const session = await getServerSession(authOptions);

    if (!canAccessAdmin(session)) {
        redirect("/app");
    }

    const rawProjects = await db.project.findMany({
        where: {
            status: { in: ["SOW_DRAFT", "APPROVED_FOR_SOW"] }
        },
        include: {
            client: true,
            sows: {
                orderBy: { createdAt: 'desc' },
                take: 1
            },
            talent: {
                include: { user: true }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    const formattedProjects: IncomingProject[] = rawProjects.map(p => {
        const latestSow = p.sows.length > 0 ? p.sows[0].bodyRichText : null;
        const parsedSowParagraphs = latestSow ? latestSow.split("\\n\\n").filter(Boolean) : [];

        let assignedTalentName = null;
        if (p.talent?.user) {
            assignedTalentName = `${p.talent.user.firstName || ''} ${p.talent.user.lastName || ''}`.trim();
        }

        return {
            id: p.id,
            name: p.name,
            clientName: p.client?.companyName || "Unknown Client",
            clientContact: p.client?.primaryContactName || null,
            clientEmail: p.client?.email || null,
            status: p.status,
            dueDate: p.timeline || "TBD",
            budgetRange: p.budgetRange || "Pending",
            isAutoRouted: p.isAutoRouted,
            requiresRpmReview: p.requiresRpmReview,
            aiConfidenceScore: p.aiConfidenceScore || 0,
            exceptionReason: p.exceptionReason || null,
            sow: parsedSowParagraphs,
            createdAt: p.createdAt.toISOString(),
            assignedTalentName
        };
    });

    return <IncomingClient projects={formattedProjects} />;
}
