import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await db.notification.update({
            where: { id },
            data: { isRead: true }
        });

        return NextResponse.json({ message: "Notification marked as read" });
    } catch (error) {
        console.error("MARK_READ_NOTIFICATION_ERROR", error);
        return NextResponse.json({
            message: "Internal server error",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
