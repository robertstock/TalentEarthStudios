import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await requireAdmin();
    if (auth.error) {
        return auth.error;
    }

    try {
        // Next.js 15/16 requires awaiting params in API routes
        const { id } = await params;

        await db.user.update({
            where: { id },
            data: { status: "REJECTED" }
        });

        console.log(`[ADMIN ACTION] Talent ID ${id} was REJECTED.`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Reject talent error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
