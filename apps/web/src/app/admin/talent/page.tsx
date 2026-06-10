import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/auth-guards";
import TalentReviewClient, { PendingTalent } from "./TalentReviewClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminTalentPage() {
    const session = await getServerSession(authOptions);

    if (!canAccessAdmin(session)) {
        redirect("/app");
    }

    const rawTalents = await db.user.findMany({
        where: {
            role: "TALENT",
            status: "PENDING_REVIEW"
        },
        include: {
            profile: true,
            portfolio: true
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    // Format Date objects to ISO strings for client component transmission
    const formattedTalents: PendingTalent[] = rawTalents.map(t => ({
        id: t.id,
        firstName: t.firstName,
        lastName: t.lastName,
        email: t.email,
        createdAt: t.createdAt.toISOString(),
        profile: t.profile ? {
            headline: t.profile.headline,
            bio: t.profile.bio,
            location: t.profile.location,
            profileImage: t.profile.profileImage,
            primaryDiscipline: t.profile.primaryDiscipline,
            socialsInternal: t.profile.socialsInternal
        } : null,
        portfolio: t.portfolio.map(p => ({
            id: p.id,
            type: p.type,
            title: p.title,
            description: p.description,
            assetUrl: p.assetUrl
        }))
    }));

    return <TalentReviewClient talents={formattedTalents} />;
}
