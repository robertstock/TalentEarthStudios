import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const projects = await db.project.findMany({
            include: {
                category: true,
                answers: true,
                recordings: true,
                client: true, // Mobile app expects client.companyName
                adminReviews: {
                    include: { reviewer: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
        return NextResponse.json(projects, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        });
    } catch (error) {
        console.error("GET_ADMIN_PROJECTS_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
