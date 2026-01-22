import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
    try {
        // In a real app, we would get the userId from the session
        // For now, we'll clear all notifications or find the primary user
        const user = await db.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        await db.notification.deleteMany({
            where: { userId: user.id }
        });

        return NextResponse.json({ message: "All notifications cleared" });
    } catch (error) {
        console.error("CLEAR_NOTIFICATIONS_ERROR", error);
        return NextResponse.json({
            message: "Internal server error",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
