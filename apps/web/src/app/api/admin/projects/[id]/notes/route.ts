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
        const { title, content } = body;

        if (!title || !content) {
            return NextResponse.json({ message: "Missing title or content" }, { status: 400 });
        }

        const note = await db.meetingNote.create({
            data: {
                projectId: id,
                title,
                content
            }
        });

        return NextResponse.json(note);
    } catch (error) {
        console.error("CREATE_NOTE_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
