import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const talentsInDb = await db.user.findMany({
            where: {
                role: 'TALENT',
                status: 'APPROVED'
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profile: {
                    select: {
                        headline: true,
                        primaryDiscipline: true,
                        profileImage: true
                    }
                }
            }
        });

        const { MOCK_TALENTS } = await import('@/lib/mock-data');
        const { deduplicateTalents } = await import('@/lib/talent-utils');

        const allTalents = deduplicateTalents(talentsInDb, MOCK_TALENTS);

        const formattedTalents = allTalents.map(t => ({
            id: t.id,
            name: `${t.firstName} ${t.lastName}`,
            email: t.email,
            specialty: t.profile?.primaryDiscipline || t.profile?.headline || 'Talent',
            profileImage: t.profile?.profileImage
        }));

        return NextResponse.json(formattedTalents);
    } catch (error) {
        console.error("TALENT_FETCH_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
