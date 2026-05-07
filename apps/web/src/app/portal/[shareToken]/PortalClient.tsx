"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PortalClientProps {
    sowId: string;
    projectId: string;
    projectName: string;
    companyName: string;
    bodyRichText: string;
    currentStatus: string;
}

export default function PortalClient({ sowId, projectId, projectName, companyName, bodyRichText, currentStatus }: PortalClientProps) {
    const [status, setStatus] = useState<"IDLE" | "APPROVING" | "SUCCESS" | "ERROR">("IDLE");
    const router = useRouter();

    const handleApprove = async () => {
        setStatus("APPROVING");
        try {
            const res = await fetch("/api/portal/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sowId, projectId })
            });

            if (res.ok) {
                setStatus("SUCCESS");
                router.refresh();
            } else {
                setStatus("ERROR");
            }
        } catch (e) {
            setStatus("ERROR");
        }
    };

    if (currentStatus !== "DRAFT" && status === "IDLE") {
        return (
            <div className="max-w-3xl mx-auto py-16 px-6 text-center">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="ph ph-check-circle text-3xl text-blue-500"></i>
                </div>
                <h2 className="text-2xl font-light text-white mb-2">Scope Approved</h2>
                <p className="text-gray-400">
                    This Statement of Work has already been executed. Our routing engine is assigning your execution team.
                </p>
            </div>
        );
    }

    if (status === "SUCCESS") {
         return (
            <div className="max-w-3xl mx-auto py-16 px-6 text-center">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <i className="ph ph-rocket-launch text-3xl text-emerald-500"></i>
                </div>
                <h2 className="text-2xl font-light text-white mb-2">Project Initialized</h2>
                <p className="text-gray-400">
                    Your approval is recorded. The TalentEarth routing engine is now securing your talent. You will be notified via email when your specialized team is mapped.
                </p>
            </div>
        );
    }

    const sowParagraphs = bodyRichText.split("\\n\\n").filter(Boolean);

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <div className="mb-12">
                <div className="text-[10px] uppercase tracking-widest text-emerald-500 mb-2">Secure Client Portal</div>
                <h1 className="text-3xl md:text-5xl font-light text-white mb-2">{projectName}</h1>
                <p className="text-gray-500 uppercase tracking-widest text-sm">{companyName}</p>
            </div>

            <div className="bg-wme-base border border-wme-border/50 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] pointer-events-none"></div>
                
                <h3 className="text-lg font-medium text-white mb-8 flex items-center border-b border-white/10 pb-4">
                    <i className="ph ph-file-text mr-3 text-blue-500"></i> Statement of Work (Draft)
                </h3>

                <div className="space-y-6 mb-12">
                     {sowParagraphs.map((par, i) => (
                        <p key={i} className="text-gray-300 leading-relaxed text-sm md:text-base font-light whitespace-pre-wrap">
                            {par}
                        </p>
                     ))}
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 border-t border-white/10 pt-8">
                    <button 
                        onClick={handleApprove}
                        disabled={status === "APPROVING"}
                        className="w-full md:w-auto px-8 py-4 bg-white text-black font-bold uppercase tracking-widest text-sm rounded shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:bg-gray-200 transition-all disabled:opacity-50"
                    >
                        {status === "APPROVING" ? "Securing Scope..." : "Approve & Initialize"}
                    </button>
                    <button className="w-full md:w-auto px-8 py-4 bg-transparent text-gray-400 hover:text-white uppercase tracking-widest text-sm transition-colors">
                        Request Revision
                    </button>
                    
                    {status === "ERROR" && <span className="text-red-500 text-sm">System Error.</span>}
                </div>
            </div>
        </div>
    );
}
