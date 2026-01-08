import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const profileSchema = z.object({
    headline: z.string().optional(),
    bio: z.string().optional(),
    location: z.string().optional(),
    primaryDiscipline: z.string().optional(),
    skills: z.array(z.string()).optional(),
    industries: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    profileImage: z.string().optional(),
    websiteInternal: z.string().optional(),
    // socialInternal could be handled as JSON or specific fields, keeping it simple for now
});

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const profile = await db.talentProfile.findUnique({
            where: { userId: session.user.id },
        });

        // If no specific profile exists yet, return empty object or partial user data
        return NextResponse.json(profile || {});
    } catch (error) {
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const data = profileSchema.parse(body);

        // Generate a readable slug if it doesn't exist (e.g. john-doe-1234)
        // We use upsert, so if updating, we keep existing slug unless it's missing

        let publicSlugCandidate = undefined;

        // If creating new, we need a slug
        const existingProfile = await db.talentProfile.findUnique({ where: { userId: session.user.id } });
        if (!existingProfile?.publicSlug) {
            const user = await db.user.findUnique({ where: { id: session.user.id } });
            const baseSlug = `${user?.firstName || 'talent'}-${user?.lastName || ''}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            const randomSuffix = Math.floor(Math.random() * 10000).toString();
            publicSlugCandidate = `${baseSlug}-${randomSuffix}`;
        }

        const profile = await db.talentProfile.upsert({
            where: { userId: session.user.id },
            update: {
                ...data,
                // Only set slug if it was missing before, otherwise keep it stable
                ...(existingProfile?.publicSlug ? {} : { publicSlug: publicSlugCandidate || `${session.user.id.slice(0, 8)}` })
            },
            create: {
                userId: session.user.id,
                publicSlug: publicSlugCandidate || `${session.user.id.slice(0, 8)}`,
                ...data,
            },
        });

        // Auto-approve user to ensure visibility in Talent directory
        await db.user.update({
            where: { id: session.user.id },
            data: { status: 'APPROVED' }
        });

        return NextResponse.json(profile);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: "Invalid input", errors: error.errors }, { status: 400 });
        }
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
