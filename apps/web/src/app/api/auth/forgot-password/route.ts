import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isPasswordResetEmailConfigured, sendPasswordResetEmail } from "@/lib/email";
import { createPasswordResetToken } from "@/lib/password-reset";
import { z } from "zod";

const requestSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
});

export async function POST(req: Request) {
    try {
        const parsed = requestSchema.safeParse(await req.json());
        if (!parsed.success) {
            return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
        }

        if (!isPasswordResetEmailConfigured()) {
            console.warn("[PASSWORD_RESET_EMAIL_NOT_CONFIGURED]");
            return NextResponse.json(
                { message: "Password recovery email is temporarily unavailable." },
                { status: 503 },
            );
        }

        const { email } = parsed.data;

        const user = await db.user.findFirst({
            where: {
                email: {
                    equals: email,
                    mode: "insensitive",
                },
            },
        });

        if (!user) {
            // For security, don't reveal that the user doesn't exist
            return NextResponse.json({ success: true });
        }

        const { token, tokenHash, expiresAt } = createPasswordResetToken();

        await db.user.update({
            where: { id: user.id },
            data: {
                resetToken: tokenHash,
                resetTokenExpiry: expiresAt,
            },
        });

        try {
            await sendPasswordResetEmail(email, token);
        } catch (deliveryError) {
            await db.user.update({
                where: { id: user.id },
                data: { resetToken: null, resetTokenExpiry: null },
            });
            console.error("[PASSWORD_RESET_DELIVERY_ERROR]", deliveryError);
            return NextResponse.json(
                { message: "The reset email could not be delivered. Please try again later." },
                { status: 503 },
            );
        }

        console.info("[PASSWORD_RESET_EMAIL_SENT]");
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[FORGOT_PASSWORD_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
