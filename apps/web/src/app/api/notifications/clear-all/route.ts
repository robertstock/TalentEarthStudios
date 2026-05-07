import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth-guards";

export async function POST(req: Request) {
    const { session, error } = await requireSession();
    if (error) {
        return error;
    }

    try {
        await db.notification.deleteMany({
            where: { userId: session.user.id }
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
