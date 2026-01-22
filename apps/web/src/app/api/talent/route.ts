import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const talent = await db.user.findMany({
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

        // Apply overrides and deduplicate with mocks (same as website directory)
        const { MOCK_TALENTS } = await import('@/lib/mock-data');

        const existingEmails = new Set(talent.map(t => t.email.toLowerCase()));
        const existingNames = new Set(talent.map(t => `${t.firstName} ${t.lastName}`.toLowerCase()));

        const talentList = talent.map(t => {
            let name = `${t.firstName} ${t.lastName}`;
            let profileImage = t.profile?.profileImage;

            // Jane Simpson Override
            if (t.firstName === 'Jane' && (t.lastName === 'Doe' || t.lastName === 'Simpson')) {
                name = 'Jane Simpson';
                profileImage = '/talent-faces/avatar-5.jpg';
            }

            return {
                id: t.id,
                name: name,
                email: t.email,
                specialty: t.profile?.primaryDiscipline || t.profile?.headline || 'Talent',
                profileImage: profileImage
            };
        });

        const uniqueMockTalents = MOCK_TALENTS.filter(t => {
            const emailMatch = existingEmails.has(t.email.toLowerCase());
            const nameMatch = existingNames.has(`${t.firstName} ${t.lastName}`.toLowerCase());
            return !emailMatch && !nameMatch;
        });

        const formattedMocks = uniqueMockTalents.map(t => ({
            id: t.id,
            name: `${t.firstName} ${t.lastName}`,
            email: t.email,
            specialty: t.profile.primaryDiscipline || t.profile.headline,
            profileImage: t.profile.profileImage
        }));

        const allTalent = [...talentList, ...formattedMocks];

        return NextResponse.json(allTalent);
    } catch (error) {
        console.error("TALENT_FETCH_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
