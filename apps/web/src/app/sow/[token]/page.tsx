import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import ClientSowView from "./ClientSowView";

export default async function ClientSowPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;

    const sow = await db.sOW.findUnique({
        where: { shareToken: token },
        include: {
            project: {
                include: { client: true }
            },
            clientResponses: {
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!sow) {
        notFound();
    }

    const currentStatus = sow.clientResponses.length > 0 
        ? sow.clientResponses[0].responseType 
        : "PENDING";

    return (
        <main className="min-h-screen bg-[#030508] text-white">
            <ClientSowView 
                sowId={sow.id}
                token={token}
                projectName={sow.project.name}
                companyName={sow.project.client?.companyName || "Client"}
                version={sow.versionNumber}
                bodyRichText={sow.bodyRichText || ""}
                currentStatus={currentStatus}
                createdAt={sow.createdAt}
            />
        </main>
    );
}
