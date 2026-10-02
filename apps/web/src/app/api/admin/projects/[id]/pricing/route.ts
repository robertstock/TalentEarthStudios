import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import {
    calculateProjectPricing,
    calculateRetailMultiplier,
    MAX_RETAIL_MULTIPLIER,
    MIN_RETAIL_MULTIPLIER,
    parseRetailPriceInput,
} from "@/lib/project-pricing";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { error } = await requireAdmin();
        if (error) return error;

        const { id } = await params;
        const body: unknown = await req.json();
        return await db.$transaction(async (tx) => {
            await tx.$queryRaw`SELECT id FROM "Project" WHERE id = ${id} FOR UPDATE`;
            const input = body && typeof body === "object" ? body as Record<string, unknown> : {};

            const existingProject = await tx.project.findUnique({
                where: { id },
                select: {
                    id: true,
                    pricingPolicy: true,
                    vendorBills: {
                        select: { id: true, amount: true, category: true, vendorName: true },
                    },
                },
            });
            if (!existingProject) {
                return NextResponse.json({ message: "Project not found" }, { status: 404 });
            }

            const currentPricing = calculateProjectPricing(existingProject.vendorBills, 1, existingProject.pricingPolicy);
            let multiplier: number | null = null;

            if (input.retailPrice !== undefined) {
                const retailPrice = parseRetailPriceInput(input.retailPrice);
                multiplier = retailPrice === null
                    ? null
                    : calculateRetailMultiplier(
                        retailPrice,
                        currentPricing.markupEligibleCosts,
                        currentPricing.passThroughCosts,
                    );
            } else {
                const requestedMultiplier = Number(input.multiplier);
                if (
                    Number.isFinite(requestedMultiplier)
                    && requestedMultiplier >= MIN_RETAIL_MULTIPLIER
                    && requestedMultiplier <= MAX_RETAIL_MULTIPLIER
                ) {
                    multiplier = Math.round(requestedMultiplier * 100_000_000) / 100_000_000;
                }
            }

            if (multiplier === null) {
                return NextResponse.json(
                    { message: "Retail price must be within the pricing range shown for this job" },
                    { status: 400 },
                );
            }

            const project = await tx.project.update({
                where: { id },
                data: { retailMultiplier: multiplier, priceApprovedVersion: null, priceApprovedById: null, priceApprovedAt: null },
                select: { id: true, retailMultiplier: true },
            });

            const savedPricing = calculateProjectPricing(existingProject.vendorBills, project.retailMultiplier, existingProject.pricingPolicy);

            return NextResponse.json({
                success: true,
                project: {
                    ...project,
                    retailPrice: savedPricing.retailPrice,
                },
            });
        });
    } catch (error) {
        console.error("UPDATE_PROJECT_PRICING_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
