"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

export interface IncomingProject {
    id: string;
    name: string;
    clientName: string;
    clientContact: string | null;
    clientEmail: string | null;
    status: string;
    dueDate: string;
    budgetRange: string;
    isAutoRouted: boolean;
    requiresRpmReview: boolean;
    aiConfidenceScore: number;
    exceptionReason: string | null;
    sow: string[];
    createdAt: string;
    assignedTalentName: string | null;
}

interface IncomingClientProps {
    projects: IncomingProject[];
}

export default function IncomingClient({ projects }: IncomingClientProps) {
    const router = useRouter();
    const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || "");
    const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

    const [isEditingSow, setIsEditingSow] = useState(false);
    const [editedSowText, setEditedSowText] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setIsEditingSow(false);
        setEditedSowText("");
    }, [selectedProjectId]);

    const handleSaveSow = async () => {
        if (!selectedProject) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/projects/${selectedProject.id}/sow`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bodyRichText: editedSowText })
            });
            if (res.ok) {
                setIsEditingSow(false);
                router.refresh();
            } else {
                console.error("Failed to save SOW");
                alert("Failed to save SOW. Please try again.");
            }
        } catch (e) {
            console.error("Error saving SOW:", e);
            alert("Error saving SOW. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleApproveProject = async () => {
        if (!selectedProject) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/projects/${selectedProject.id}/move-to-active`, {
                method: 'POST'
            });
            if (res.ok) {
                router.refresh();
            } else {
                console.error("Failed to approve project");
                alert("Failed to approve project. Please try again.");
            }
        } catch (e) {
            console.error("Error approving project:", e);
            alert("Error approving project. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    if (projects.length === 0) {
        return (
            <div className="container mx-auto pt-32 pb-12 px-6 text-white min-h-screen">
                <div className="mb-8">
                    <Link href="/admin" className="text-sm text-gray-400 hover:text-white transition flex items-center gap-2 mb-4 w-fit">
                        <i className="ph ph-arrow-left"></i> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-white">Incoming Projects</h1>
                </div>
                <div className="mt-12 text-center text-gray-500 bg-white/5 border border-white/10 rounded-2xl p-12">
                    No incoming projects pending review.
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto pt-32 pb-12 px-6 text-white min-h-screen flex flex-col">
            <div className="mb-8">
                <Link href="/admin" className="text-sm text-gray-400 hover:text-white transition flex items-center gap-2 mb-4 w-fit">
                    <i className="ph ph-arrow-left"></i> Back to Dashboard
                </Link>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-white">Incoming Projects</h1>
                        <p className="text-gray-400 mt-2">Review AI-generated SOWs and finalize routing decisions.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
                {/* LEFT COLUMN: List */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    {projects.map((project) => (
                        <button
                            key={project.id}
                            onClick={() => setSelectedProjectId(project.id)}
                            className={`text-left w-full p-5 rounded-xl border transition-all duration-300 relative overflow-hidden ${
                                selectedProjectId === project.id 
                                ? "bg-blue-900/30 border-blue-500/50 shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)]" 
                                : "bg-white/5 border-white/10 hover:bg-white/10"
                            }`}
                        >
                            {selectedProjectId === project.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                            )}

                            <div className="flex justify-between items-start mb-2">
                                <h3 className={`font-bold text-lg ${selectedProjectId === project.id ? "text-white" : "text-gray-200"}`}>
                                    {project.name}
                                </h3>
                            </div>
                            
                            <p className="text-sm text-gray-400 line-clamp-1 mb-3">{project.clientName}</p>
                            
                            <div className="flex justify-between items-end mt-4">
                                <span className="text-[10px] uppercase tracking-wider text-gray-500">
                                    {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                                </span>
                                {project.requiresRpmReview ? (
                                    <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] uppercase px-2 py-1 rounded-full">Requires Review</span>
                                ) : (
                                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] uppercase px-2 py-1 rounded-full">Auto-Routed</span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                {/* RIGHT COLUMN: Review Panel */}
                <div className="lg:col-span-8">
                    {selectedProject && (
                        <div className="bg-[#0B0F15]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 h-full shadow-2xl relative overflow-hidden flex flex-col">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 border-b border-white/5 pb-8">
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2">{selectedProject.name}</h2>
                                    <p className="text-lg text-gray-400">{selectedProject.clientName}</p>
                                    {(selectedProject.clientContact || selectedProject.clientEmail) && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            {selectedProject.clientContact} {selectedProject.clientEmail ? `(${selectedProject.clientEmail})` : ''}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-3 text-sm md:text-right">
                                    <div>
                                        <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Target Timeline</span>
                                        <span className="text-white font-mono bg-white/5 px-3 py-1.5 rounded">{selectedProject.dueDate}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Estimated Budget</span>
                                        <span className="text-emerald-400 font-mono bg-emerald-500/10 px-3 py-1.5 rounded">{selectedProject.budgetRange}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8 flex gap-4 overflow-x-auto">
                                <div className="bg-black/40 border border-white/5 rounded-lg p-4 flex-1">
                                    <div className="text-[10px] uppercase text-gray-500 mb-1">AI Confidence</div>
                                    <div className={`text-2xl font-light ${selectedProject.aiConfidenceScore >= 85 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                        {selectedProject.aiConfidenceScore}%
                                    </div>
                                </div>
                                <div className="bg-black/40 border border-white/5 rounded-lg p-4 flex-1">
                                    <div className="text-[10px] uppercase text-gray-500 mb-1">Routing Recommendation</div>
                                    <div className="text-lg text-white font-light mt-1">
                                        {selectedProject.assignedTalentName ? selectedProject.assignedTalentName : 'Manual Review Required'}
                                    </div>
                                </div>
                            </div>

                            {selectedProject.exceptionReason && selectedProject.exceptionReason !== "None" && (
                                <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                    <div className="text-xs font-bold uppercase tracking-wider text-yellow-500 mb-2 flex items-center gap-2">
                                        <i className="ph ph-warning"></i> Missing Information Identified
                                    </div>
                                    <p className="text-yellow-200/80 text-sm leading-relaxed">{selectedProject.exceptionReason}</p>
                                </div>
                            )}

                            <div className="flex-1 flex flex-col min-h-0">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
                                    <i className="ph ph-file-text"></i> Draft Statement of Work (SOW)
                                </h3>
                                <div className="bg-black/30 border border-white/5 rounded-xl p-6 overflow-y-auto flex-1">
                                    {isEditingSow ? (
                                        <textarea
                                            value={editedSowText}
                                            onChange={(e) => setEditedSowText(e.target.value)}
                                            className="w-full h-full min-h-[200px] bg-transparent text-gray-300 leading-relaxed text-sm resize-none focus:outline-none"
                                            placeholder="Enter SOW details here..."
                                        />
                                    ) : (
                                        <>
                                            {selectedProject.sow.map((paragraph, index) => (
                                                <p key={index} className="text-gray-300 leading-relaxed text-sm mb-4 last:mb-0">
                                                    {paragraph}
                                                </p>
                                            ))}
                                            {selectedProject.sow.length === 0 && (
                                                <p className="text-gray-500 italic">No SOW draft available.</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/10 flex gap-4 justify-end">
                                {isEditingSow ? (
                                    <>
                                        <button 
                                            onClick={() => setIsEditingSow(false)}
                                            disabled={isSaving}
                                            className="px-6 py-3 border border-white/10 hover:bg-white/5 text-white text-sm font-bold uppercase tracking-widest rounded transition-colors disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleSaveSow}
                                            disabled={isSaving}
                                            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold uppercase tracking-widest rounded transition-colors shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {isSaving ? <i className="ph ph-spinner animate-spin"></i> : <i className="ph ph-floppy-disk"></i>}
                                            Save SOW
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button 
                                            onClick={() => {
                                                setEditedSowText(selectedProject.sow.join("\n\n"));
                                                setIsEditingSow(true);
                                            }}
                                            className="px-6 py-3 border border-white/10 hover:bg-white/5 text-white text-sm font-bold uppercase tracking-widest rounded transition-colors"
                                        >
                                            Edit SOW
                                        </button>
                                        <button 
                                            onClick={handleApproveProject}
                                            disabled={isSaving}
                                            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold uppercase tracking-widest rounded transition-colors shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {isSaving ? <i className="ph ph-spinner animate-spin"></i> : null}
                                            Approve & Move to Active
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
