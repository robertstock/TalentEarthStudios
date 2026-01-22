import { db as prisma } from "@/lib/db";
import { Metadata } from "next";
import TalentBrowser from "@/components/TalentBrowser";

export const metadata: Metadata = {
    title: "Talent Index | WME+",
    description: "Verified execution units.",
};

export default async function TalentDirectory() {
    let talents: any[] = [];
    try {
        talents = await prisma.user.findMany({
            where: { role: 'TALENT', status: 'APPROVED' },
            include: { profile: true },
        });
    } catch (e) {
        console.warn("Could not fetch talents from DB, falling back to mocks", e);
    }

    // MOCK: Inject additional profiles and deduplicate
    const { MOCK_TALENTS } = await import('@/lib/mock-data');
    const { deduplicateTalents } = await import('@/lib/talent-utils');

    const allTalents = deduplicateTalents(talents, MOCK_TALENTS);

    return (
        <div className="relative z-10 w-full min-h-screen pt-20 md:pt-24 pb-12">
            <TalentBrowser initialTalents={allTalents as any} />
        </div>
    );
}
