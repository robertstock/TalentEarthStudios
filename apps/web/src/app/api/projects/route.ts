import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";
export const dynamic = 'force-dynamic';

export async function GET() {
    const auth=await requireAdmin();if(auth.error)return auth.error;
    try {
        const projects = await db.project.findMany({
            include: {
                category: true,
                answers: true,
                recordings: true,
                adminReviews: {
                    include: { reviewer: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
        return NextResponse.json(projects);
    } catch (error) {
        console.error("GET_PROJECTS_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function POST() {
 return NextResponse.json({message:'Start a new project through Finley at /request.'},{status:410});
}
