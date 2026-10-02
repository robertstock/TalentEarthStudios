import { createHash } from "node:crypto";
import type { ProjectPricingLine } from "./project-pricing";

// Explicit immutable account allowlist; an empty new setting never falls back to an old grant.
export function configuredApproverIds(configured = process.env.PRICE_APPROVER_USER_IDS ?? process.env.PRICE_APPROVER_USER_ID ?? "") {
  return [...new Set(configured.split(",").map(id=>id.trim()).filter(Boolean))];
}
export function canApprovePrice(userId: string | null | undefined, configured = process.env.PRICE_APPROVER_USER_IDS ?? process.env.PRICE_APPROVER_USER_ID ?? "") {
  return Boolean(userId && configuredApproverIds(configured).includes(userId));
}
export async function isActivePriceApprover(tx: Pick<import("@prisma/client").Prisma.TransactionClient, "user">, userId: string | null | undefined) {
  if(!canApprovePrice(userId)) return false;
  const user=await tx.user.findUnique({where:{id:userId!},select:{role:true,status:true}});
  return user?.role==="ADMIN" && user.status==="APPROVED";
}

export function projectPriceVersion(project: {
  retailMultiplier: number;
  pricingPolicy: string;
  vendorBills: ProjectPricingLine[];
}) {
  const costs = project.vendorBills.map(({ id, amount, category, vendorName }) => (
    { id, amount, category, vendorName }
  )).sort((a, b) => a.id.localeCompare(b.id));
  return createHash("sha256").update(JSON.stringify({
    policy: project.pricingPolicy,
    multiplier: project.retailMultiplier,
    costs,
  })).digest("hex");
}

export function hasPriceApproval(project: {
  priceApprovedVersion: string | null;
  priceApprovedById: string | null;
  priceApprovedAt: Date | null;
}, version: string) {
  return Boolean(project.priceApprovedById && project.priceApprovedAt && project.priceApprovedVersion === version);
}
