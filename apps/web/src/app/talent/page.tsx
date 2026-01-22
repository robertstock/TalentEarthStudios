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

    // MOCK: Override for Jane Doe to make her look like a real user
    talents.forEach(talent => {
        if (talent.firstName === 'Jane' && (talent.lastName === 'Doe' || talent.lastName === 'Simpson')) {
            talent.lastName = 'Simpson';
            if (talent.profile) {
                talent.profile.profileImage = '/talent-faces/avatar-5.jpg';
                if (!talent.profile.bio || talent.profile.bio.includes("No bio")) {
                    talent.profile.bio = "Award-winning filmmaker and visual storyteller with over 10 years of experience in commercial and narrative cinema. Specializing in creating emotionally resonant content for global brands and independent films. Based in Los Angeles, but available for travel worldwide.";
                }
            }
        }
    });

    // MOCK: Inject additional profiles
    const { MOCK_TALENTS } = await import('@/lib/mock-data');

    // Combine real (modified) talents with mock talents
    // Deduplicate by email OR name to avoid overlapping database and mock records
    const existingEmails = new Set(talents.map(t => t.email.toLowerCase()));
    const existingNames = new Set(talents.map(t => `${t.firstName} ${t.lastName}`.toLowerCase()));

    const uniqueMockTalents = MOCK_TALENTS.filter(t => {
        const emailMatch = existingEmails.has(t.email.toLowerCase());
        const nameMatch = existingNames.has(`${t.firstName} ${t.lastName}`.toLowerCase());
        return !emailMatch && !nameMatch;
    });

    const allTalents = [...talents, ...uniqueMockTalents];

    return (
        <div className="relative z-10 w-full min-h-screen pt-20 md:pt-24 pb-12">
            <TalentBrowser initialTalents={allTalents as any} />
        </div>
    );
}
