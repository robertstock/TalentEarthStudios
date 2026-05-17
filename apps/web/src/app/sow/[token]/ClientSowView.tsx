"use client";

import { useState } from "react";
import Image from "next/image";

interface ClientSowViewProps {
    sowId: string;
    token: string;
    projectName: string;
    companyName: string;
    version: number;
    bodyRichText: string;
    currentStatus: string;
    createdAt: Date;
}

export default function ClientSowView({
    token,
    projectName,
    companyName,
    version,
    bodyRichText,
    currentStatus,
    createdAt
}: ClientSowViewProps) {
    const [status, setStatus] = useState(currentStatus);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [comments, setComments] = useState("");
    const [showRevisions, setShowRevisions] = useState(false);

    const paragraphs = bodyRichText.split("\n\n").filter(Boolean);

    const handleAction = async (decision: "APPROVED" | "REVISION_REQUESTED") => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/sow/${token}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ decision, comments: decision === "REVISION_REQUESTED" ? comments : undefined })
            });

            if (res.ok) {
                setStatus(decision);
                setShowRevisions(false);
            } else {
                alert("An error occurred while submitting your response.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-24">
            
            {/* Header / Logo */}
            <div className="flex flex-col items-center justify-center mb-16 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>
                <Image 
                    src="/images/logo_icon.png" 
                    alt="TalentEarthStudios" 
                    width={80} 
                    height={80} 
                    className="mb-6 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] z-10"
                />
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white z-10 text-center">
                    Statement of Work
                </h1>
                <p className="text-gray-400 mt-4 text-center z-10">
                    Prepared for <span className="text-white font-medium">{companyName}</span>
                </p>
            </div>

            {/* Document Container */}
            <div className="bg-[#0B0F15]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative z-10">
                
                {/* Status Bar */}
                {status === "APPROVED" && (
                    <div className="bg-emerald-500/20 border-b border-emerald-500/30 p-4 text-center text-emerald-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                        <i className="ph ph-check-circle text-xl"></i> Legally Binding & Approved
                    </div>
                )}
                {status === "REVISION_REQUESTED" && (
                    <div className="bg-yellow-500/20 border-b border-yellow-500/30 p-4 text-center text-yellow-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                        <i className="ph ph-warning-circle text-xl"></i> Revisions Requested by Client
                    </div>
                )}

                <div className="p-8 md:p-12">
                    {/* Meta Info */}
                    <div className="flex flex-wrap justify-between gap-6 pb-8 border-b border-white/10 mb-8">
                        <div>
                            <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Project Name</div>
                            <div className="font-bold text-xl">{projectName}</div>
                        </div>
                        <div className="flex gap-8">
                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Version</div>
                                <div className="font-mono text-blue-400">1.{version - 1}</div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Date</div>
                                <div className="font-mono text-gray-300">{new Date(createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-6 text-gray-300 font-light leading-relaxed">
                        {paragraphs.map((para, i) => (
                            <p key={i} className="whitespace-pre-wrap">{para}</p>
                        ))}
                    </div>

                    {/* Actions */}
                    {status === "PENDING" && (
                        <div className="mt-16 pt-8 border-t border-white/10">
                            {showRevisions ? (
                                <div className="bg-black/40 border border-white/5 rounded-xl p-6 animate-fade-in">
                                    <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-widest mb-4">Request Adjustments</h3>
                                    <textarea 
                                        rows={4}
                                        value={comments}
                                        onChange={e => setComments(e.target.value)}
                                        placeholder="Please describe the changes you would like to see in the SOW..."
                                        className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-white focus:outline-none focus:border-yellow-500 transition-colors mb-4 resize-none"
                                    />
                                    <div className="flex gap-4">
                                        <button 
                                            onClick={() => handleAction("REVISION_REQUESTED")}
                                            disabled={!comments || isSubmitting}
                                            className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold uppercase tracking-widest rounded transition-colors disabled:opacity-50"
                                        >
                                            {isSubmitting ? "Submitting..." : "Send to Team"}
                                        </button>
                                        <button 
                                            onClick={() => setShowRevisions(false)}
                                            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest rounded transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col md:flex-row gap-6 justify-center">
                                    <button 
                                        onClick={() => setShowRevisions(true)}
                                        className="flex-1 max-w-sm px-8 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-3 group"
                                    >
                                        <i className="ph ph-chat-text text-xl group-hover:scale-110 transition-transform"></i>
                                        Request Revisions
                                    </button>
                                    <button 
                                        onClick={() => handleAction("APPROVED")}
                                        disabled={isSubmitting}
                                        className="flex-1 max-w-sm px-8 py-5 bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] text-white font-bold uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-3 group"
                                    >
                                        {isSubmitting ? (
                                            <i className="ph ph-spinner animate-spin text-xl"></i>
                                        ) : (
                                            <i className="ph ph-pen-nib text-xl group-hover:scale-110 transition-transform"></i>
                                        )}
                                        Approve & Sign Off
                                    </button>
                                </div>
                            )}
                            <p className="text-center text-xs text-gray-500 mt-6">
                                By clicking "Approve & Sign Off", you agree to the scope and terms outlined in this document.
                            </p>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="text-center mt-12 text-xs text-gray-600 uppercase tracking-widest">
                Powered by Finley Operating System
            </div>
        </div>
    );
}
