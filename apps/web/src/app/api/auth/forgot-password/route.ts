import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isPasswordResetEmailConfigured, sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";
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
            return NextResponse.json(
                { message: "Password recovery email is temporarily unavailable." },
                { status: 503 },
            );
        }

        const { email } = parsed.data;

        const user = await db.user.findUnique({
            where: { email },
        });

        if (!user) {
            // For security, don't reveal that the user doesn't exist
            return NextResponse.json({ success: true });
        }

        // Generate token
        const token = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

        await db.user.update({
            where: { id: user.id },
            data: {
                resetToken: tokenHash,
                resetTokenExpiry: expiry,
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

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[FORGOT_PASSWORD_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
