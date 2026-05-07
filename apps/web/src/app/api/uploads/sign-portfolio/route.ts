import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, BUCKET_PUBLIC } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";
import { requireTalentOrAdmin } from "@/lib/auth-guards";
import { z } from "zod";

const uploadSchema = z.object({
    contentType: z.string().min(1),
    fileName: z.string().min(1),
});

export async function POST(req: NextRequest) {
    const auth = await requireTalentOrAdmin();
    if (auth.error) {
        return auth.error;
    }
    const { session } = auth;

    try {
        const { contentType, fileName } = uploadSchema.parse(await req.json());

        // Generate unique key: portfolio/{userId}/{uuid}-{filename}
        // We sanitize filename a bit to avoid weird chars
        const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "");
        const key = `portfolio/${session.user.id}/${uuidv4()}-${sanitizedName}`;

        const command = new PutObjectCommand({
            Bucket: BUCKET_PUBLIC,
            Key: key,
            ContentType: contentType,
            // Metadata if needed
        });

        const url = await getSignedUrl(s3Client, command, { expiresIn: 60 * 5 }); // 5 minutes

        return NextResponse.json({
            uploadUrl: url,
            finalUrl: `https://${BUCKET_PUBLIC}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
        }
        console.error("Sign Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
