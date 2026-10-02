import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { resolveProjectClientName } from "@/lib/project-client";
import { calculateProjectPricing } from "@/lib/project-pricing";
import { completionMonth, type SalesProject } from "@/lib/monthly-sales";
import MonthlySalesClient from "./MonthlySalesClient";

export const revalidate = 0;

export default async function MonthlySalesPage() {
  const session = await getServerSession(authOptions);
  if (!session)
    redirect("/auth/signin?callbackUrl=%2Fadmin%2Freports%2Fmonthly-sales");
  if (!(await canAccessAdmin(session))) redirect("/app");

  const projects = await db.project.findMany({
    where: { status: "COMPLETED" },
    select: {
      id: true,
      name: true,
      jobName: true,
      status: true,
      completedAt: true,
      clientNameOverride: true,
      client: { select: { companyName: true, email: true } },
      retailMultiplier: true,
      vendorBills: {
        select: { id: true, amount: true, category: true, vendorName: true },
      },
    },
    orderBy: { completedAt: "desc" },
  });

  const salesProjects: SalesProject[] = projects.map((project) => {
    const pricing = calculateProjectPricing(
      project.vendorBills,
      project.retailMultiplier,
    );
    return {
      id: project.id,
      name: project.jobName || project.name,
      client: resolveProjectClientName({
        clientNameOverride: project.clientNameOverride,
        linkedClientName: project.client?.companyName,
        linkedClientEmail: project.client?.email,
        administratorEmail: session.user?.email,
      }),
      status: project.status,
      completedAt: project.completedAt?.toISOString() ?? null,
      sales: pricing.retailPrice,
      costs: pricing.totalCosts,
      costItemCount: project.vendorBills.length,
    };
  });

  const currentYear = Number(
    completionMonth(new Date().toISOString())!.slice(0, 4),
  );
  return (
    <MonthlySalesClient projects={salesProjects} currentYear={currentYear} />
  );
}
