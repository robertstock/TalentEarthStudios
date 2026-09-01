import { compare, hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSession } from "@/lib/auth-guards";
import { db } from "@/lib/db";

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string()
        .min(12, "New password must be at least 12 characters")
        .max(128, "New password is too long"),
});

export async function POST(request: Request) {
    const { session, error } = await requireSession();
    if (error || !session?.user?.id) {
        return error || NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = passwordSchema.parse(await request.json());
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { passwordHash: true },
        });

        if (!user?.passwordHash) {
            return NextResponse.json({ message: "This account does not use a password." }, { status: 409 });
        }

        const currentPasswordIsValid = await compare(body.currentPassword, user.passwordHash);
        if (!currentPasswordIsValid) {
            return NextResponse.json({ message: "The current password is incorrect." }, { status: 400 });
        }

        const passwordIsUnchanged = await compare(body.newPassword, user.passwordHash);
        if (passwordIsUnchanged) {
            return NextResponse.json({ message: "Choose a password you have not already used." }, { status: 400 });
        }

        await db.user.update({
            where: { id: session.user.id },
            data: {
                passwordHash: await hash(body.newPassword, 12),
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: error.errors[0]?.message || "Invalid password." }, { status: 400 });
        }

        console.error("CHANGE_PASSWORD_ERROR", error);
        return NextResponse.json({ message: "Password could not be changed." }, { status: 500 });
    }
}
