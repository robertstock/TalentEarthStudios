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
        const input = body && typeof body === "object" ? body as Record<string, unknown> : {};

        const existingProject = await db.project.findUnique({
            where: { id },
            select: {
                id: true,
                vendorBills: {
                    select: { id: true, amount: true, category: true, vendorName: true },
                },
            },
        });
        if (!existingProject) {
            return NextResponse.json({ message: "Project not found" }, { status: 404 });
        }

        const currentPricing = calculateProjectPricing(existingProject.vendorBills, 1);
        let multiplier: number | null = null;

        if (input.retailPrice !== undefined) {
            const retailPrice = parseRetailPriceInput(input.retailPrice);
            multiplier = retailPrice === null
                ? null
                : calculateRetailMultiplier(
                    retailPrice,
                    currentPricing.markupEligibleCosts,
                    currentPricing.deliveryCosts,
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
                { message: "Retail price must be within the 0× to 10× pricing range, with delivery passed through at cost" },
                { status: 400 },
            );
        }

        const project = await db.project.update({
            where: { id },
            data: { retailMultiplier: multiplier },
            select: { id: true, retailMultiplier: true },
        });

        const savedPricing = calculateProjectPricing(existingProject.vendorBills, project.retailMultiplier);

        return NextResponse.json({
            success: true,
            project: {
                ...project,
                retailPrice: savedPricing.retailPrice,
            },
        });
    } catch (error) {
        console.error("UPDATE_PROJECT_PRICING_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
