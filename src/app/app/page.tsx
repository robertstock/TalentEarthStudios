import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import Image from "next/image";

export default async function Dashboard() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/api/auth/signin");
    }

    // Fetch latest data
    const user = await db.user.findUnique({
        where: { id: session.user.id },
        include: {
            profile: true,
            _count: {
                select: { assignedProjects: true }
            }
        }
    });

    // Helper for Status Badge
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'text-green-400 bg-green-500/10 border-green-500/20';
            case 'PENDING_REVIEW': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-24 pb-12">
            <div className="max-w-[1400px] mx-auto px-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-white/5 pb-8">
                    <div>
                        <div className="text-xs font-mono text-emerald-500 mb-2 tracking-widest uppercase">
                            <span className="w-2 h-2 inline-block rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                            System Online
                        </div>
                        <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white mb-2">
                            Welcome, <span className="font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">{user?.firstName}</span>
                        </h1>
                        <p className="text-slate-400 max-w-lg font-light">
                            Manage your creative profile, view project requests, and track your performance metrics.
                        </p>
                    </div>

                    <div className="mt-6 md:mt-0 flex gap-4">
                        <Link href={`/talent/${user?.profile?.publicSlug || user?.id}`} className="px-5 py-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-sm font-medium flex items-center gap-2">
                            <i className="ph ph-eye text-lg"></i>
                            Public View
                        </Link>
                    </div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Column 1: Profile Card */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A] p-1 shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none"></div>

                            <div className="relative p-6 z-10">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 overflow-hidden relative shadow-lg">
                                        {user?.profile?.profileImage ? (
                                            <Image src={user.profile.profileImage} alt="Profile" fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <i className="ph ph-user text-3xl text-slate-600"></i>
                                            </div>
                                        )}
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(user?.status || 'DRAFT')}`}>
                                        {user?.status}
                                    </div>
                                </div>

                                <h3 className="text-xl font-medium text-white mb-1">{user?.firstName} {user?.lastName}</h3>
                                <p className="text-sm text-slate-400 mb-6">{user?.profile?.headline || 'No headline set'}</p>

                                <div className="space-y-3 pt-6 border-t border-white/5">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Profile Completion</span>
                                        <span className="text-blue-400 font-mono">
                                            {user?.profile?.bio && user.profile.skills.length > 0 ? '85%' : '40%'}
                                        </span>
                                    </div>
                                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                                            style={{ width: user?.profile?.bio && user.profile.skills.length > 0 ? '85%' : '40%' }}
                                        ></div>
                                    </div>
                                </div>

                                <Link href="/app/profile" className="mt-8 block w-full py-3 bg-white text-black text-center rounded-lg font-medium hover:bg-slate-200 transition-colors">
                                    Edit Profile
                                </Link>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                    <i className="ph ph-images text-xl"></i>
                                </div>
                                <div>
                                    <h3 className="font-medium text-white">Portfolio</h3>
                                    <p className="text-xs text-slate-500">Manage your showcase</p>
                                </div>
                            </div>
                            <Link href="/app/portfolio" className="text-xs uppercase tracking-wider text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group">
                                Manage Assets <i className="ph ph-arrow-right group-hover:translate-x-1 transition-transform"></i>
                            </Link>
                        </div>
                    </div>

                    {/* Column 2 & 3: Main Content */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="p-6 rounded-2xl border border-white/10 bg-[#0A0A0A] hover:bg-[#0F0F0F] transition-colors">
                                <div className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-3">Active Requests</div>
                                <div className="text-3xl text-white font-light">{user?._count.assignedProjects || 0}</div>
                            </div>
                            <div className="p-6 rounded-2xl border border-white/10 bg-[#0A0A0A] hover:bg-[#0F0F0F] transition-colors">
                                <div className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-3">Profile Views</div>
                                <div className="text-3xl text-white font-light">1,204</div>
                            </div>
                            <div className="p-6 rounded-2xl border border-white/10 bg-[#0A0A0A] hover:bg-[#0F0F0F] transition-colors">
                                <div className="text-slate-500 text-xs uppercase tracking-wider font-medium mb-3">Rating</div>
                                <div className="text-3xl text-white font-light flex items-center gap-2">
                                    4.9 <i className="ph-fill ph-star text-amber-500 text-lg"></i>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="rounded-2xl border border-white/10 bg-[#0A0A0A] overflow-hidden min-h-[400px]">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <h3 className="font-light text-lg text-white">Recent Projects</h3>
                                <Link href="/app/requests" className="text-xs text-slate-500 hover:text-white transition-colors">View All</Link>
                            </div>

                            <div className="p-8 flex flex-col items-center justify-center text-center h-[300px]">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                    <i className="ph ph-tray text-2xl text-slate-600"></i>
                                </div>
                                <h4 className="text-white font-medium mb-2">No active projects</h4>
                                <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">
                                    You don't have any active project requests at the moment.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
