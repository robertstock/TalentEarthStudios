import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const teams = await db.team.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        leader: {
          select: {
            email: true,
          },
        },
        members: {
          where: { status: "ACTIVE" },
          select: {
            userId: true,
          },
        },
      },
    });

    const formattedTeams = teams.map((t) => ({
      id: t.id,
      name: t.name,
      email: t.leader?.email || "",
      members: t.members,
    }));

    return NextResponse.json(formattedTeams);
  } catch (error) {
    console.error("TEAMS_FETCH_ERROR", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
