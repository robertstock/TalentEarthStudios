"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

export interface PendingTalent {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
    profile: {
        headline: string | null;
        bio: string | null;
        location: string | null;
        profileImage: string | null;
        primaryDiscipline: string | null;
        socialsInternal: any; // JSON
    } | null;
    portfolio: {
        id: string;
        type: "IMAGE" | "VIDEO" | "LINK";
        title: string | null;
        description: string | null;
        assetUrl: string;
    }[];
}

interface TalentReviewClientProps {
    talents: PendingTalent[];
}

export default function TalentReviewClient({ talents }: TalentReviewClientProps) {
    const router = useRouter();
    const [selectedTalentId, setSelectedTalentId] = useState<string>(talents[0]?.id || "");
    const selectedTalent = talents.find(t => t.id === selectedTalentId) || talents[0];

    const [isProcessing, setIsProcessing] = useState(false);

    // Sync selected ID when talents changes (e.g. after an approval removes the active item)
    useEffect(() => {
        if (talents.length > 0 && (!selectedTalentId || !talents.some(t => t.id === selectedTalentId))) {
            setSelectedTalentId(talents[0].id);
        }
    }, [talents, selectedTalentId]);

    const handleApprove = async () => {
        if (!selectedTalent) return;
        if (!confirm(`Are you sure you want to approve ${selectedTalent.firstName} ${selectedTalent.lastName}?`)) return;

        setIsProcessing(true);
        try {
            const res = await fetch(`/api/admin/talent/${selectedTalent.id}/approve`, {
                method: "POST"
            });
            if (res.ok) {
                router.refresh();
            } else {
                console.error("Failed to approve talent");
                alert("Failed to approve talent. Please try again.");
            }
        } catch (e) {
            console.error("Error approving:", e);
            alert("Error approving talent profile.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedTalent) return;
        if (!confirm(`Are you sure you want to reject ${selectedTalent.firstName} ${selectedTalent.lastName}?`)) return;

        setIsProcessing(true);
        try {
            const res = await fetch(`/api/admin/talent/${selectedTalent.id}/reject`, {
                method: "POST"
            });
            if (res.ok) {
                router.refresh();
            } else {
                console.error("Failed to reject talent");
                alert("Failed to reject talent. Please try again.");
            }
        } catch (e) {
            console.error("Error rejecting:", e);
            alert("Error rejecting talent profile.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (talents.length === 0) {
        return (
            <div className="container mx-auto pt-32 pb-12 px-6 text-white min-h-screen">
                <div className="mb-8">
                    <Link href="/admin" className="text-sm text-gray-400 hover:text-white transition flex items-center gap-2 mb-4 w-fit">
                        <i className="ph ph-arrow-left"></i> Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-white">Curated Talent Approvals</h1>
                </div>
                <div className="mt-12 text-center text-gray-500 bg-white/5 border border-white/10 rounded-2xl p-12">
                    No talent onboarding requests awaiting approval.
                </div>
            </div>
        );
    }

    // Cast socials safely
    const socials = (selectedTalent?.profile?.socialsInternal as {
        instagram?: string;
        youtube?: string;
        behance?: string;
        soundcloud?: string;
        website?: string;
    }) || {};

    return (
        <div className="container mx-auto pt-32 pb-12 px-6 text-white min-h-screen flex flex-col">
            
            {/* Page Header */}
            <div className="mb-8">
                <Link href="/admin" className="text-sm text-gray-400 hover:text-white transition flex items-center gap-2 mb-4 w-fit">
                    <i className="ph ph-arrow-left"></i> Back to Dashboard
                </Link>
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-white">Curated Talent Approvals</h1>
                    <p className="text-gray-400 mt-2">Review creative portfolios, locations, and social evidence before admitting them to the network.</p>
                </div>
            </div>

            {/* Split Screen Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
                
                {/* Left Column: Candidates List */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    {talents.map((talent) => (
                        <button
                            key={talent.id}
                            onClick={() => setSelectedTalentId(talent.id)}
                            className={`text-left w-full p-5 rounded-xl border transition-all duration-300 relative overflow-hidden ${
                                selectedTalentId === talent.id 
                                ? "bg-orange-950/20 border-orange-500/50 shadow-[0_0_30px_-10px_rgba(249,115,22,0.3)]" 
                                : "bg-white/5 border-white/10 hover:bg-white/10"
                            }`}
                        >
                            {selectedTalentId === talent.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]"></div>
                            )}

                            <div className="flex justify-between items-start mb-2">
                                <h3 className={`font-bold text-lg ${selectedTalentId === talent.id ? "text-white" : "text-gray-200"}`}>
                                    {talent.firstName} {talent.lastName}
                                </h3>
                            </div>
                            
                            <p className="text-sm text-gray-400 line-clamp-1 mb-3">{talent.profile?.headline || "Creative Specialist"}</p>
                            
                            <div className="flex justify-between items-end mt-4">
                                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-mono">
                                    Submitted {formatDistanceToNow(new Date(talent.createdAt), { addSuffix: true })}
                                </span>
                                <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] uppercase px-2-3 py-1 rounded-full font-semibold">Pending Approval</span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Right Column: Portfolio Inspector Panel */}
                <div className="lg:col-span-8">
                    {selectedTalent && (
                        <div className="bg-[#0B0F15]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col h-full">
                            
                            {/* Candidate Core Info Header */}
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6 border-b border-white/5 pb-6">
                                <div className="flex items-center gap-4">
                                    {selectedTalent.profile?.profileImage ? (
                                        <div className="w-16 h-16 rounded-full border border-slate-700 overflow-hidden relative bg-slate-950 flex-shrink-0">
                                            <img src={selectedTalent.profile.profileImage} alt={selectedTalent.firstName} className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 rounded-full border border-slate-700 bg-slate-950 flex items-center justify-center flex-shrink-0">
                                            <i className="ph ph-user text-2xl text-slate-500"></i>
                                        </div>
                                    )}
                                    <div>
                                        <h2 className="text-2xl font-bold text-white leading-tight">{selectedTalent.firstName} {selectedTalent.lastName}</h2>
                                        <p className="text-orange-400 font-semibold text-sm mt-1">{selectedTalent.profile?.headline || "Creative Specialist"}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{selectedTalent.email}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col md:items-end text-sm">
                                    <span className="text-slate-500 text-xs uppercase tracking-wider mb-1">Location</span>
                                    <span className="text-white font-mono bg-white/5 px-3 py-1.5 rounded flex items-center gap-1.5">
                                        <i className="ph ph-map-pin text-brand-green"></i>
                                        {selectedTalent.profile?.location || "Unknown"}
                                    </span>
                                </div>
                            </div>

                            {/* Creative Social Sync Links */}
                            <div className="mb-6">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Sync Portfolio Links</h3>
                                <div className="flex flex-wrap gap-3">
                                    {socials.instagram && (
                                        <a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 text-pink-400 rounded-lg text-xs font-semibold tracking-wider transition">
                                            <i className="ph ph-instagram-logo"></i> Instagram
                                        </a>
                                    )}
                                    {socials.youtube && (
                                        <a href={socials.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-xs font-semibold tracking-wider transition">
                                            <i className="ph ph-youtube-logo"></i> YouTube
                                        </a>
                                    )}
                                    {socials.behance && (
                                        <a href={socials.behance} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-lg text-xs font-semibold tracking-wider transition">
                                            <i className="ph ph-behance-logo"></i> Behance
                                        </a>
                                    )}
                                    {socials.soundcloud && (
                                        <a href={socials.soundcloud} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 rounded-lg text-xs font-semibold tracking-wider transition">
                                            <i className="ph ph-waveform"></i> SoundCloud
                                        </a>
                                    )}
                                    {socials.website && (
                                        <a href={socials.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold tracking-wider transition">
                                            <i className="ph ph-globe"></i> Website
                                        </a>
                                    )}
                                    {!socials.instagram && !socials.youtube && !socials.behance && !socials.soundcloud && !socials.website && (
                                        <span className="text-slate-500 text-xs italic">No portfolio links synchronised.</span>
                                    )}
                                </div>
                            </div>

                            {/* Biography */}
                            {selectedTalent.profile?.bio && (
                                <div className="mb-6">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Biography</h3>
                                    <div className="bg-black/30 border border-white/5 rounded-xl p-4 text-sm text-slate-300 leading-relaxed font-light">
                                        {selectedTalent.profile.bio}
                                    </div>
                                </div>
                            )}

                            {/* Direct Portfolio Media Assets */}
                            <div className="flex-1 flex flex-col min-h-[200px]">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                                    <i className="ph ph-images"></i> Uploaded Assets ({selectedTalent.portfolio.length})
                                </h3>
                                <div className="bg-black/45 border border-white/5 rounded-xl p-4 overflow-y-auto flex-1 max-h-[350px]">
                                    {selectedTalent.portfolio.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedTalent.portfolio.map((item) => {
                                                const isImage = item.type === "IMAGE";
                                                const isVideo = item.type === "VIDEO";

                                                if (isImage) {
                                                    return (
                                                        <div key={item.id} className="border border-white/5 bg-slate-900/35 rounded-lg overflow-hidden flex flex-col p-2 gap-2">
                                                            <a href={item.assetUrl} target="_blank" rel="noopener noreferrer" className="relative block h-32 w-full bg-slate-950 rounded overflow-hidden">
                                                                <img src={item.assetUrl} alt={item.title || "Portfolio Image"} className="w-full h-full object-cover hover:scale-105 transition duration-500" />
                                                            </a>
                                                            <span className="text-[10px] text-slate-400 font-medium truncate block px-1">{item.title}</span>
                                                        </div>
                                                    );
                                                }

                                                if (isVideo) {
                                                    return (
                                                        <div key={item.id} className="border border-white/5 bg-slate-900/35 rounded-lg overflow-hidden flex flex-col p-2 gap-2">
                                                            <div className="relative h-32 w-full bg-slate-950 rounded overflow-hidden">
                                                                <video src={item.assetUrl} controls className="w-full h-full object-cover" />
                                                            </div>
                                                            <span className="text-[10px] text-slate-400 font-medium truncate block px-1">{item.title}</span>
                                                        </div>
                                                    );
                                                }

                                                // Document PDF link
                                                return (
                                                    <a 
                                                        key={item.id} 
                                                        href={item.assetUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="md:col-span-2 flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition text-xs"
                                                    >
                                                        <i className="ph ph-file-pdf text-orange-400 text-xl"></i>
                                                        <div className="flex-1 truncate">
                                                            <span className="text-slate-200 block truncate font-medium">{item.title || "PDF Resume/Portfolio"}</span>
                                                            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">View Document</span>
                                                        </div>
                                                        <i className="ph ph-arrow-square-out text-slate-500"></i>
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 italic text-xs text-center py-8">No direct files uploaded. Social links sync is used.</p>
                                    )}
                                </div>
                            </div>

                            {/* Curation Admin Action Buttons */}
                            <div className="mt-6 pt-6 border-t border-white/10 flex gap-4 justify-end">
                                <button 
                                    onClick={handleReject}
                                    disabled={isProcessing}
                                    className="px-6 py-3 border border-red-500/30 hover:bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-widest rounded transition-colors disabled:opacity-50"
                                >
                                    {isProcessing ? "Processing..." : "Reject Profile"}
                                </button>
                                <button 
                                    onClick={handleApprove}
                                    disabled={isProcessing}
                                    className="px-6 py-3 bg-brand-green hover:bg-brand-green/90 text-white text-xs font-bold uppercase tracking-widest rounded transition-colors shadow-[0_0_20px_rgba(122,201,67,0.3)] disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isProcessing ? <i className="ph ph-spinner animate-spin"></i> : null}
                                    Approve Profile
                                </button>
                            </div>

                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
