import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import PortalClient from "./PortalClient";

interface Props {
  params: { shareToken: string };
}

export default async function PortalPage({ params }: Props) {
    const { shareToken } = params;

    const sow = await db.sOW.findUnique({
        where: { shareToken },
        include: {
            project: {
                include: { client: true }
            }
        }
    });

    if (!sow || !sow.project) {
        return notFound();
    }

    return (
        <div className="min-h-screen bg-[#030508] relative font-sans selection:bg-wme-blue/30 selection:text-white pb-20">
            {/* Minimal Header */}
            <header className="px-6 py-8 border-b border-white/5 bg-black/50 backdrop-blur-md">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <img src="/TalentEarthStudioLogo_White.png" alt="TalentEarth Studios" className="h-6 object-contain opacity-80" />
                    <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
                        Reference: {sow.projectId.slice(-6)}
                    </div>
                </div>
            </header>

            <PortalClient 
                sowId={sow.id}
                projectId={sow.projectId}
                projectName={sow.project.name}
                companyName={sow.project.client?.companyName || "Client"}
                bodyRichText={sow.bodyRichText || ""}
                currentStatus={sow.status}
            />
        </div>
    );
}
