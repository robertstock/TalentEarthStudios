import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const notifications = await db.notification.findMany({
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { firstName: true, lastName: true, email: true } } }
        });

        return NextResponse.json({
            meta: { unread: notifications.filter(n => !n.isRead).length },
            data: notifications
        });
    } catch (error) {
        console.error("GET_NOTIFICATIONS_ERROR", error);
        return NextResponse.json({
            message: "Internal server error",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
