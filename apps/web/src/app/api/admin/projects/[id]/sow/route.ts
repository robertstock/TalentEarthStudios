import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const { bodyRichText } = body;

        if (bodyRichText === undefined) {
            return NextResponse.json({ message: "Missing bodyRichText" }, { status: 400 });
        }

        // Get the latest SOW for this project
        const latestSow = await db.sOW.findFirst({
            where: { projectId: id },
            orderBy: { versionNumber: 'desc' }
        });

        if (!latestSow) {
            return NextResponse.json({ message: "No SOW found for this project" }, { status: 404 });
        }

        // Update the SOW
        await db.sOW.update({
            where: { id: latestSow.id },
            data: { bodyRichText }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("UPDATE_SOW_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
