import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

    // Check if S3 is configured
    const isS3Configured = BUCKET_PUBLIC && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY;

    try {
        const { contentType, fileName } = uploadSchema.parse(await req.json());

        // Generate unique filename
        const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "");
        const uuid = uuidv4();

        if (!isS3Configured) {
            console.log("S3 not configured, falling back to local storage");
            // Local Storage Fallback: Return URL to our local upload handler and final public path
            const localFileName = `${session.user.id}-${uuid}-${sanitizedName}`;

            // Ensure we return the full path needed for the client to PUT to
            const uploadUrl = new URL(`/api/uploads/local?filename=${localFileName}`, req.url).toString();

            return NextResponse.json({
                uploadUrl: uploadUrl,
                finalUrl: `/uploads/profiles/${localFileName}`
            });
        }

        const key = `profiles/${session.user.id}/${uuid}-${sanitizedName}`;

        const command = new PutObjectCommand({
            Bucket: BUCKET_PUBLIC,
            Key: key,
            ContentType: contentType,
            // Cache control for profile images (e.g. 24 hours)
            CacheControl: "max-age=86400",
        });

        const url = await getSignedUrl(s3Client, command, { expiresIn: 60 * 5 });

        return NextResponse.json({
            uploadUrl: url,
            finalUrl: `https://${BUCKET_PUBLIC}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
        }
        console.error("Sign Profile Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
