
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { z } from "zod";
import { randomUUID } from "crypto";

const userSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().min(1, "Email is required").email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    portfolioUrl: z.string().url("Portfolio must be a valid URL").optional().or(z.literal("")),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email: rawEmail, password, firstName, lastName, portfolioUrl } = userSchema.parse(body);
        const email = rawEmail.trim().toLowerCase();

        const existingUser = await db.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { user: null, message: "User with this email already exists" },
                { status: 409 }
            );
        }

        const passwordHash = await hash(password, 10);
        const baseSlug = `${firstName}-${lastName}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "talent";

        const newUser = await db.user.create({
            data: {
                firstName,
                lastName,
                email,
                passwordHash,
                role: "TALENT",
                status: "PENDING_REVIEW",
                profile: {
                    create: {
                        publicSlug: `${baseSlug}-${randomUUID().slice(0, 8)}`,
                        skills: [],
                        industries: [],
                        languages: [],
                    }
                },
                ...(portfolioUrl ? {
                    portfolio: {
                        create: {
                            type: "LINK",
                            title: "Application Portfolio",
                            assetUrl: portfolioUrl,
                            isPublic: true,
                        }
                    }
                } : {})
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                status: true,
                createdAt: true,
            }
        });

        return NextResponse.json(
            { user: newUser, message: "User created successfully" },
            { status: 201 }
        );

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { user: null, message: error.errors[0].message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { user: null, message: "Something went wrong" },
            { status: 500 }
        );
    }
}
