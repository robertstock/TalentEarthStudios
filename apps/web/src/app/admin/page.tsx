import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

import { authOptions } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDashboard() {
    const session = await getServerSession(authOptions);

    if (!canAccessAdmin(session)) {
        redirect("/app");
    }

    const [incomingCount, pendingTalentCount, totalTalentCount, activeProjectCount, newLeadCount] = await Promise.all([
        db.project.count({
            where: {
                status: { in: ["SOW_DRAFT", "APPROVED_FOR_SOW"] }
            }
        }),
        db.user.count({
            where: {
                role: "TALENT",
                status: "PENDING_REVIEW"
            }
        }),
        db.user.count({
            where: {
                role: "TALENT",
                status: "APPROVED"
            }
        }),
        db.project.count({
            where: {
                status: { notIn: ["COMPLETED", "CANCELLED"] }
            }
        }),
        db.lead.count({ where: { status: "NEW" } })
    ]);
    return (
        <div className="container mx-auto pt-32 pb-12 px-6 text-white">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-gray-400 mt-2">Live operational data from the production database.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
                <Link href="/admin/incoming" className="block bg-blue-900/20 border border-blue-500/30 p-6 rounded-lg hover:bg-blue-900/40 hover:border-blue-500/50 transition duration-300 group shadow-[0_0_15px_-3px_rgba(59,130,246,0.5)]">
                    <div className="flex justify-between items-start">
                        <h3 className="text-blue-400 group-hover:text-blue-300 transition-colors font-bold uppercase text-xs tracking-wider">Incoming Projects</h3>
                        <i className="ph ph-arrow-up-right text-blue-500 group-hover:text-blue-400 transition-colors"></i>
                    </div>
                    <p className="text-4xl font-bold mt-2 text-white group-hover:text-blue-100 transition-colors">{incomingCount}</p>
                </Link>
                <Link href="/admin/talent" className="block bg-orange-950/20 border border-orange-500/30 p-6 rounded-lg hover:bg-orange-950/40 hover:border-orange-500/50 transition duration-300 group shadow-[0_0_15px_-3px_rgba(249,115,22,0.5)]">
                    <div className="flex justify-between items-start">
                        <h3 className="text-orange-400 group-hover:text-orange-300 transition-colors font-bold uppercase text-xs tracking-wider font-semibold">Awaiting Approval</h3>
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                        </span>
                    </div>
                    <p className="text-4xl font-bold mt-2 text-white group-hover:text-orange-100 transition-colors">{pendingTalentCount}</p>
                </Link>
                <Link href="/talent" className="block bg-white/5 border border-white/10 p-6 rounded-lg hover:bg-blue-900/40 hover:border-blue-500/50 transition duration-300 group">
                    <div className="flex justify-between items-start">
                        <h3 className="text-gray-400 group-hover:text-blue-200 transition-colors font-bold uppercase text-xs tracking-wider">Total Talent</h3>
                        <i className="ph ph-arrow-up-right text-gray-500 group-hover:text-blue-400 transition-colors"></i>
                    </div>
                    <p className="text-4xl font-bold mt-2 text-white group-hover:text-blue-100 transition-colors">{totalTalentCount}</p>
                </Link>
                <Link href="/admin/projects" className="block bg-white/5 border border-white/10 p-6 rounded-lg hover:bg-blue-900/40 hover:border-blue-500/50 transition duration-300 group">
                    <div className="flex justify-between items-start">
                        <h3 className="text-gray-400 group-hover:text-blue-200 transition-colors font-bold uppercase text-xs tracking-wider">Active Projects</h3>
                        <i className="ph ph-arrow-up-right text-gray-500 group-hover:text-blue-400 transition-colors"></i>
                    </div>
                    <p className="text-4xl font-bold mt-2 text-white group-hover:text-blue-100 transition-colors">{activeProjectCount}</p>
                </Link>
                <Link href="/admin/incoming" className="block bg-white/5 border border-white/10 p-6 rounded-lg hover:bg-blue-900/40 hover:border-blue-500/50 transition duration-300 group">
                    <div className="flex justify-between items-start">
                        <h3 className="text-gray-400 group-hover:text-blue-200 transition-colors font-bold uppercase text-xs tracking-wider">New Leads</h3>
                        <i className="ph ph-arrow-up-right text-gray-500 group-hover:text-blue-400 transition-colors"></i>
                    </div>
                    <p className="text-4xl font-bold mt-2 text-white group-hover:text-blue-100 transition-colors">{newLeadCount}</p>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="border border-white/10 rounded-lg p-6 bg-white/5">
                    <h2 className="font-bold text-xl mb-4 text-white">Quick Actions</h2>
                    <div className="space-y-3">
                        <Link href="/request" className="flex w-full items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold transition-colors">
                            <i className="ph ph-plus-circle text-lg"></i>
                            Create Project Request
                        </Link>
                        <Link href="/admin/teams" className="flex w-full items-center justify-center gap-2 py-3 border border-white/15 hover:border-blue-500/40 hover:bg-blue-900/20 rounded text-white transition-colors">
                            <i className="ph ph-users-three text-lg"></i>
                            Manage Teams
                        </Link>
                    </div>
                </div>
                <div className="border border-white/10 rounded-lg p-6 bg-white/5">
                    <h2 className="font-bold text-xl mb-4 text-white">Operations</h2>
                    <div className="space-y-3">
                        <Link href="/admin/projects" className="flex w-full items-center justify-center gap-2 py-3 border border-white/15 hover:border-emerald-500/40 hover:bg-emerald-900/20 rounded text-white transition-colors">
                            <i className="ph ph-kanban text-lg"></i>
                            Project Tracker
                        </Link>
                        <Link href="/admin/reports" className="flex w-full items-center justify-center gap-2 py-3 border border-white/15 hover:border-emerald-500/40 hover:bg-emerald-900/20 rounded text-white transition-colors">
                            <i className="ph ph-chart-line-up text-lg"></i>
                            Financial Reports
                        </Link>
                    </div>
                </div>
            </div>

            <div className="mt-12 text-center">
                <Link href="/" className="text-sm text-gray-500 hover:text-white transition">
                    &larr; Return to Home
                </Link>
            </div>
        </div>
    );
}
