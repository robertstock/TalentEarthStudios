import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, BUCKET_PUBLIC } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { contentType, fileName } = await req.json();

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
        console.error("Sign Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
