import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";

const resetSchema = z.object({
    token: z.string().regex(/^[a-f0-9]{64}$/i, "Invalid reset link"),
    password: z.string().min(12, "Password must be at least 12 characters").max(128),
});

export async function POST(req: Request) {
    try {
        const parsed = resetSchema.safeParse(await req.json());
        if (!parsed.success) {
            return NextResponse.json(
                { message: parsed.error.errors[0]?.message || "Invalid password reset request." },
                { status: 400 },
            );
        }

        const { token, password } = parsed.data;
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

        const user = await db.user.findFirst({
            where: {
                resetToken: tokenHash,
                resetTokenExpiry: {
                    gt: new Date(),
                },
            },
        });

        if (!user) {
            return NextResponse.json({ message: "This reset link is invalid or has expired." }, { status: 400 });
        }

        const hashedPassword = await hash(password, 12);

        await db.user.update({
            where: { id: user.id },
            data: {
                passwordHash: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[RESET_PASSWORD_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
