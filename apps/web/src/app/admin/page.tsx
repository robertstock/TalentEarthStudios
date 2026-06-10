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

    const incomingCount = await db.project.count({
        where: {
            status: { in: ["SOW_DRAFT", "APPROVED_FOR_SOW"] }
        }
    });

    const pendingTalentCount = await db.user.count({
        where: {
            role: "TALENT",
            status: "PENDING_REVIEW"
        }
    });

    return (
        <div className="container mx-auto pt-32 pb-12 px-6 text-white">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard (Demo)</h1>

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
                <div className="bg-white/5 border border-white/10 p-6 rounded-lg hover:bg-white/10 transition">
                    <h3 className="text-gray-400 font-bold uppercase text-xs tracking-wider">Total Talent</h3>
                    <p className="text-4xl font-bold mt-2 text-white">145</p>
                </div>
                <Link href="/admin/projects" className="block bg-white/5 border border-white/10 p-6 rounded-lg hover:bg-blue-900/40 hover:border-blue-500/50 transition duration-300 group">
                    <div className="flex justify-between items-start">
                        <h3 className="text-gray-400 group-hover:text-blue-200 transition-colors font-bold uppercase text-xs tracking-wider">Active Projects</h3>
                        <i className="ph ph-arrow-up-right text-gray-500 group-hover:text-blue-400 transition-colors"></i>
                    </div>
                    <p className="text-4xl font-bold mt-2 text-white group-hover:text-blue-100 transition-colors">5</p>
                </Link>
                <div className="bg-white/5 border border-white/10 p-6 rounded-lg hover:bg-white/10 transition">
                    <h3 className="text-gray-400 font-bold uppercase text-xs tracking-wider">New Leads</h3>
                    <p className="text-4xl font-bold mt-2 text-white">24</p>
                </div>
            </div>

            <div className="p-8 bg-blue-900/20 border border-blue-500/30 rounded-xl mb-8">
                <h2 className="text-xl font-semibold mb-2 text-blue-100">Welcome to Demo Mode</h2>
                <p className="text-blue-200/70">
                    This is a read-only view of the Admin Dashboard. Database connections and authentication are currently simulated.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="border border-white/10 rounded-lg p-6 bg-white/5">
                    <h2 className="font-bold text-xl mb-4 text-white">Quick Actions</h2>
                    <div className="space-y-3">
                        <button className="block w-full text-center py-3 bg-white/10 text-white/50 rounded cursor-not-allowed">
                            + Create Project Request (Disabled)
                        </button>
                        <button className="block w-full text-center py-3 border border-white/10 rounded text-white/50 cursor-not-allowed">
                            Manage Teams (Disabled)
                        </button>
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
