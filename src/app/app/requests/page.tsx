"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns"; // We might need to install date-fns or use native Intl

export default function RequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const res = await fetch("/api/requests");
                if (res.ok) {
                    const data = await res.json();
                    setRequests(data);
                }
            } catch (error) {
                console.error("Failed to fetch requests", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading requests...</div>;
    }

    return (
        <div className="container mx-auto py-12 px-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Project Requests</h1>
                    <p className="text-sm text-gray-400">Manage your incoming work and proposals.</p>
                </div>
            </div>

            {requests.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-lg">
                    <p className="text-gray-500 mb-2">No active project requests found.</p>
                    <p className="text-xs text-gray-600">Once you are assigned a project, it will appear here.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {requests.map((req) => (
                        <div key={req.id} className="bg-wme-surface border border-white/5 rounded-lg p-6 hover:border-white/10 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1">{req.title}</h2>
                                    <div className="flex items-center gap-3 text-sm text-gray-400">
                                        <span>{req.category || "Uncategorized"}</span>
                                        <span>•</span>
                                        <span>{format(new Date(req.createdAt), "MMM d, yyyy")}</span>
                                        {req.assignedTeam && (
                                            <>
                                                <span>•</span>
                                                <span className="text-blue-400">Team: {req.assignedTeam.name}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${req.status === 'DRAFT' ? 'bg-gray-800 text-gray-400' :
                                        req.status === 'SENT' ? 'bg-blue-900/30 text-blue-400' :
                                            req.status === 'QUOTE_RECEIVED' ? 'bg-yellow-900/30 text-yellow-400' :
                                                'bg-green-900/30 text-green-400'
                                    }`}>
                                    {req.status.replace("_", " ")}
                                </span>
                            </div>

                            <p className="text-gray-400 text-sm mb-6 line-clamp-2">{req.description}</p>

                            <div className="flex items-center gap-6 text-sm">
                                <div>
                                    <span className="block text-xs uppercase tracking-wider text-gray-600 mb-1">Timeline</span>
                                    <span className="text-white">{req.timeline}</span>
                                </div>
                                <div>
                                    <span className="block text-xs uppercase tracking-wider text-gray-600 mb-1">Budget</span>
                                    <span className="text-white">{req.budgetRange || "N/A"}</span>
                                </div>
                                {req.dueDateForQuote && (
                                    <div>
                                        <span className="block text-xs uppercase tracking-wider text-gray-600 mb-1">Quote Due</span>
                                        <span className="text-white">{format(new Date(req.dueDateForQuote), "MMM d")}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
