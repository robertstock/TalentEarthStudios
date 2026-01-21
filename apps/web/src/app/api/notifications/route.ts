import { NextResponse } from "next/server";

export async function GET(req: Request) {
    // Mock notifications for now
    return NextResponse.json({
        meta: { unread: 0 },
        data: []
    });
}
