import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            include: {
                teamMemberships: {
                    where: { status: "ACTIVE" },
                    select: { teamId: true }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const teamIds = user.teamMemberships.map(tm => tm.teamId);

        const requests = await db.project.findMany({
            where: {
                OR: [
                    { assignedUserId: session.user.id },
                    { assignedTeamId: { in: teamIds } }
                ]
            },
            include: {
                assignedTeam: {
                    select: { name: true }
                },
                createdBy: {
                    select: { firstName: true, lastName: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(requests);
    } catch (error) {
        console.error("Failed to fetch requests", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
