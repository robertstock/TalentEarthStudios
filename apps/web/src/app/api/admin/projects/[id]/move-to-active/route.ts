import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }

        const { id } = await params;

        // Move the project to IN_PROGRESS
        await db.project.update({
            where: { id },
            data: { status: 'IN_PROGRESS' }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("MOVE_TO_ACTIVE_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
