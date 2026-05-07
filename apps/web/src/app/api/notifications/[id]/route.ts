import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth-guards";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { session, error } = await requireSession();
    if (error) {
        return error;
    }

    try {
        const { id } = await params;

        const notification = await db.notification.findUnique({
            where: { id },
            select: { id: true, userId: true },
        });

        if (!notification || notification.userId !== session.user.id) {
            return NextResponse.json({ message: "Not found" }, { status: 404 });
        }

        await db.notification.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Notification deleted" });
    } catch (error) {
        console.error("DELETE_NOTIFICATION_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
