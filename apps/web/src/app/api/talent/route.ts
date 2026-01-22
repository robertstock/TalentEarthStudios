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
                        primaryDiscipline: true
                    }
                }
            }
        });

        // Format for mobile app expectation
        const formattedTalent = talent.map(t => ({
            id: t.id,
            name: `${t.firstName} ${t.lastName}`,
            email: t.email,
            specialty: t.profile?.primaryDiscipline || t.profile?.headline || 'Talent'
        }));

        return NextResponse.json(formattedTalent);
    } catch (error) {
        console.error("TALENT_FETCH_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
