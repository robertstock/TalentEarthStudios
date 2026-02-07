// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import { redirect } from "next/navigation";
// import { isAdmin } from "@/lib/rbac";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function AdminDashboard() {
    // DEMO MODE: Bypassing auth check for demo purposes
    // const session = await getServerSession(authOptions);

    // DEMO MODE: Bypassing auth check for demo purposes
    // if (!isAdmin(session)) {
    //     redirect("/");
    // }

    // Counts
    // DEMO MODE: Mock data
    // const pendingReviews = await db.user.count({ where: { status: "PENDING_REVIEW" } });
    // const totalTalent = await db.user.count({ where: { role: "TALENT" } });
    // const activeProjects = await db.project.count({ where: { status: { not: "CLOSED" } } });
    // const newLeads = await db.lead.count({ where: { status: "NEW" } });

    const pendingReviews = 12;
    const totalTalent = 145;
    const activeProjects = 8;
    const newLeads = 24;

    return (
        <div className="container mx-auto py-12 px-6">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <Link href="/admin/reviews" className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg hover:shadow-md transition">
                    <h3 className="text-yellow-800 font-bold">Pending Reviews</h3>
                    <p className="text-4xl font-bold text-yellow-900 mt-2">{pendingReviews}</p>
                </Link>
                <Link href="/admin/talent" className="bg-white border p-6 rounded-lg hover:shadow-md transition">
                    <h3 className="text-gray-600 font-bold">Total Talent</h3>
                    <p className="text-4xl font-bold mt-2">{totalTalent}</p>
                </Link>
                <Link href="/admin/projects" className="bg-white border p-6 rounded-lg hover:shadow-md transition">
                    <h3 className="text-gray-600 font-bold">Active Projects</h3>
                    <p className="text-4xl font-bold mt-2">{activeProjects}</p>
                </Link>
                <Link href="/admin/leads" className="bg-white border p-6 rounded-lg hover:shadow-md transition">
                    <h3 className="text-gray-600 font-bold">New Leads</h3>
                    <p className="text-4xl font-bold mt-2">{newLeads}</p>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="border rounded-lg p-6">
                    <h2 className="font-bold text-xl mb-4">Quick Actions</h2>
                    <div className="space-y-3">
                        <Link href="/admin/projects" className="block w-full text-center py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                            + Create Project Request
                        </Link>
                        <Link href="/admin/teams" className="block w-full text-center py-2 border rounded hover:bg-gray-50">
                            Manage Teams
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
