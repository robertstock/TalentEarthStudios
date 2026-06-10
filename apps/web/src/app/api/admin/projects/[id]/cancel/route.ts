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
        const body = await req.json();
        const { reason } = body;

        if (!reason || !reason.trim()) {
            return NextResponse.json({ message: "Missing cancellation reason" }, { status: 400 });
        }

        const updatedProject = await db.project.update({
            where: { id },
            data: {
                status: "CANCELLED",
                cancelledAt: new Date(),
                cancellationReason: reason.trim()
            }
        });

        return NextResponse.json({ success: true, project: updatedProject });
    } catch (error) {
        console.error("CANCEL_PROJECT_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
