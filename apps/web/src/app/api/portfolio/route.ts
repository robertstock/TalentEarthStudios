import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { requireTalentOrAdmin } from "@/lib/auth-guards";

const portfolioSchema = z.object({
    type: z.enum(["IMAGE", "VIDEO", "LINK"]),
    title: z.string().optional(),
    description: z.string().optional(),
    assetUrl: z.string().url("Invalid URL"),
    thumbnailUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export async function GET() {
    const { session, error } = await requireTalentOrAdmin();
    if (error) {
        return error;
    }

    try {
        const items = await db.portfolioItem.findMany({
            where: { userId: session.user.id },
            orderBy: { sortOrder: "asc" },
        });

        return NextResponse.json(items);
    } catch (error) {
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const { session, error } = await requireTalentOrAdmin();
    if (error) {
        return error;
    }

    try {
        const body = await req.json();
        const data = portfolioSchema.parse(body);

        const count = await db.portfolioItem.count({
            where: { userId: session.user.id }
        });

        const newItem = await db.portfolioItem.create({
            data: {
                userId: session.user.id,
                ...data,
                sortOrder: count,
            },
        });

        return NextResponse.json(newItem, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: "Invalid input", errors: error.errors }, { status: 400 });
        }
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const { session, error } = await requireTalentOrAdmin();
    if (error) {
        return error;
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ message: "Missing id" }, { status: 400 });
        }

        const item = await db.portfolioItem.findUnique({
            where: { id }
        });

        if (!item || item.userId !== session.user.id) {
            return NextResponse.json({ message: "Not found or unauthorized" }, { status: 404 });
        }

        await db.portfolioItem.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
