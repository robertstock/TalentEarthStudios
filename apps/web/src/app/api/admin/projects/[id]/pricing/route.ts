import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { error } = await requireAdmin();
        if (error) return error;

        const { id } = await params;
        const body = await req.json();
        const multiplier = Number(body.multiplier);

        if (!Number.isFinite(multiplier) || multiplier < 0 || multiplier > 10) {
            return NextResponse.json(
                { message: "Multiplier must be between 0 and 10" },
                { status: 400 },
            );
        }

        const project = await db.project.update({
            where: { id },
            data: { retailMultiplier: Math.round(multiplier * 10) / 10 },
            select: { id: true, retailMultiplier: true },
        });

        return NextResponse.json({ success: true, project });
    } catch (error) {
        console.error("UPDATE_PROJECT_PRICING_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
