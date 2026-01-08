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
        if (talent.firstName === 'Jane' && talent.lastName === 'Doe') {
            talent.lastName = 'Simpson';
            if (talent.profile) {
                talent.profile.profileImage = '/jane-simpson.png'; // Keeping her specific image or I could use avatar-5.jpg
                if (!talent.profile.bio || talent.profile.bio.includes("No bio")) {
                    talent.profile.bio = "Award-winning filmmaker and visual storyteller with over 10 years of experience in commercial and narrative cinema. Specializing in creating emotionally resonant content for global brands and independent films. Based in Los Angeles, but available for travel worldwide.";
                }
            }
        }
    });

    // MOCK: Inject additional profiles
    const { MOCK_TALENTS } = await import('@/lib/mock-data');

    // Combine real (modified) talents with mock talents
    // Cast MOCK_TALENTS to the same type as talents or use any if types conflict slightly (Prisma types vs interface)
    const allTalents = [...talents, ...MOCK_TALENTS];

    return (
        <div className="relative z-10 w-full min-h-screen pt-20 md:pt-24 pb-12">
            <TalentBrowser initialTalents={allTalents as any} />
        </div>
    );
}
