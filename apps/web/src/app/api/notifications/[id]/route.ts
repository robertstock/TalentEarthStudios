import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await db.notification.delete({
            where: { id }
        });

        return NextResponse.json({ message: "Notification deleted" });
    } catch (error) {
        console.error("DELETE_NOTIFICATION_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
