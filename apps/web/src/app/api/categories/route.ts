import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const categories = await db.category.findMany({
            include: {
                questionSets: {
                    include: {
                        questions: true
                    }
                }
            }
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error("Failed to fetch categories", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
