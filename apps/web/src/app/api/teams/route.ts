import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const teams = await db.team.findMany({
            select: {
                id: true,
                name: true,
                leader: {
                    select: {
                        email: true
                    }
                },
                members: {
                    select: {
                        userId: true
                    }
                }
            }
        });

        const formattedTeams = teams.map(t => ({
            id: t.id,
            name: t.name,
            email: t.leader?.email || "",
            members: t.members
        }));

        return NextResponse.json(formattedTeams);
    } catch (error) {
        console.error("TEAMS_FETCH_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
