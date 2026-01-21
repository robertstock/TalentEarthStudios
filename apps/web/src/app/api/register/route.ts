
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { z } from "zod";

const userSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().min(1, "Email is required").email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, firstName, lastName } = userSchema.parse(body);

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

        const newUser = await db.user.create({
            data: {
                firstName,
                lastName,
                email,
                passwordHash,
            },
        });

        const { passwordHash: newUserPasswordHash, ...rest } = newUser;

        return NextResponse.json(
            { user: rest, message: "User created successfully" },
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
