import Link from "next/link";

export default function AdminDashboard() {
    return (
        <div className="container mx-auto py-12 px-6 text-white">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard (Demo)</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <div className="bg-white/5 border border-white/10 p-6 rounded-lg hover:bg-white/10 transition">
                    <h3 className="text-gray-400 font-bold uppercase text-xs tracking-wider">Pending Reviews</h3>
                    <p className="text-4xl font-bold mt-2 text-white">12</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-lg hover:bg-white/10 transition">
                    <h3 className="text-gray-400 font-bold uppercase text-xs tracking-wider">Total Talent</h3>
                    <p className="text-4xl font-bold mt-2 text-white">145</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-lg hover:bg-white/10 transition">
                    <h3 className="text-gray-400 font-bold uppercase text-xs tracking-wider">Active Projects</h3>
                    <p className="text-4xl font-bold mt-2 text-white">8</p>
                </div>
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
