import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth-guards";

export async function GET(req: Request) {
    const { session, error } = await requireSession();
    if (error) {
        return error;
    }

    try {
        const notifications = await db.notification.findMany({
            where: { userId: session.user.id },
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
