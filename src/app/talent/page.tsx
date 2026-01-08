import { db as prisma } from "@/lib/db";
import { Metadata } from "next";
import TalentBrowser from "@/components/TalentBrowser";

export const metadata: Metadata = {
    title: "Talent Index | WME+",
    description: "Verified execution units.",
};

export default async function TalentDirectory() {
    const talents = await prisma.user.findMany({
        where: { role: 'TALENT', status: 'APPROVED' },
        include: { profile: true },
    });

    return (
        <div className="relative z-10 w-full min-h-screen pt-20 md:pt-24 pb-12">
            <TalentBrowser initialTalents={talents as any} />
        </div>
    );
}
