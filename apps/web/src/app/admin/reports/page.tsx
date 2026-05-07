import { db } from "@/lib/db";
import Link from "next/link";

// Dynamic report, don't cache
export const revalidate = 0;

export default async function AdminReportsPage() {
    // Bring in all financial structures
    const projects = await db.project.findMany({
        where: {
            status: { not: "DRAFT" }
        },
        include: {
            vendorBills: true,
            invoice: true
        }
    });

    // Calculate High Level Metrics
    let totalGrossRevenue = 0;
    let totalVendorCosts = 0;
    let totalPendingInvoices = 0;

    projects.forEach(p => {
        // Costs
        const projCosts = p.vendorBills.reduce((acc, bill) => acc + bill.amount, 0);
        totalVendorCosts += projCosts;

        // Revenue (Based on Invoices generated, or falls back to 'Revenue' field if we had one)
        if (p.invoice) {
            totalGrossRevenue += p.invoice.amount;
            if (p.invoice.status !== "PAID") {
                totalPendingInvoices += p.invoice.amount;
            }
        }
    });

    const netMargin = totalGrossRevenue - totalVendorCosts;
    const marginPercent = totalGrossRevenue > 0 ? ((netMargin / totalGrossRevenue) * 100).toFixed(1) : "0.0";

    return (
        <div className="container mx-auto pt-32 pb-12 px-6 text-white min-h-screen">
            <div className="mb-12">
                <Link href="/admin" className="text-sm text-gray-400 hover:text-white transition flex items-center gap-2 mb-4 w-fit">
                    <i className="ph ph-arrow-left"></i> Back to Dashboard
                </Link>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-white">Financial Reports</h1>
                        <p className="text-gray-400 mt-2">Macro-level snapshot of system-wide margins, vendor payouts, and receivables.</p>
                    </div>
                    <button className="px-6 py-3 bg-white text-black font-bold uppercase tracking-widest text-xs rounded hover:bg-gray-200 transition">
                         Export CSV
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="text-sm uppercase tracking-widest text-gray-500 mb-2">Total Gross Revenue</div>
                    <div className="text-4xl font-light text-white">${totalGrossRevenue.toLocaleString()}</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                    <div className="text-sm uppercase tracking-widest text-red-500/70 mb-2">Vendor Costs (Cogs)</div>
                    <div className="text-4xl font-light text-red-400">${totalVendorCosts.toLocaleString()}</div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
                    <div className="text-sm uppercase tracking-widest text-emerald-500/70 mb-2">Net Margin</div>
                    <div className="text-4xl font-light text-emerald-400">${netMargin.toLocaleString()}</div>
                    <div className="text-xs text-emerald-500 mt-2">{marginPercent}% Profitability</div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]">
                    <div className="text-sm uppercase tracking-widest text-blue-500/70 mb-2">A/R (Pending Client)</div>
                    <div className="text-4xl font-light text-blue-400">${totalPendingInvoices.toLocaleString()}</div>
                </div>
            </div>

            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                <i className="ph ph-list-numbers"></i> Project Ledger Breakdown
            </h2>

            <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="text-gray-500 border-b border-white/5 bg-white/5">
                            <th className="py-4 px-6 font-medium">Project Name</th>
                            <th className="py-4 px-6 font-medium">Client</th>
                            <th className="py-4 px-6 font-medium text-right">Vendor Bills</th>
                            <th className="py-4 px-6 font-medium text-right">Invoiced</th>
                            <th className="py-4 px-6 font-medium text-right">Net Margin</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map((p, i) => {
                            const pCosts = p.vendorBills.reduce((acc, b) => acc + b.amount, 0);
                            const pRev = p.invoice?.amount || 0;
                            const pMarg = pRev - pCosts;
                            
                            return (
                                <tr key={i} className="border-b border-white/5 last:border-0 text-gray-300 hover:bg-white/5 transition">
                                    <td className="py-4 px-6 font-medium text-white">{p.name}</td>
                                    <td className="py-4 px-6 text-gray-500">{p.clientId.slice(-6)}</td>
                                    <td className="py-4 px-6 text-right">${pCosts.toLocaleString()}</td>
                                    <td className="py-4 px-6 text-right text-emerald-400">${pRev.toLocaleString()}</td>
                                    <td className={`py-4 px-6 text-right font-bold ${pMarg >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                        ${pMarg.toLocaleString()}
                                    </td>
                                </tr>
                            )
                        })}
                        {projects.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-gray-500">No active financial records found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
