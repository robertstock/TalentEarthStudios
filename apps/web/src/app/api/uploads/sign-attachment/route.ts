import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, BUCKET_PRIVATE } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";
import { isAdmin } from "@/lib/rbac";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session || !isAdmin(session)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { contentType, fileName, projectRequestId } = await req.json();

        // Private bucket, key includes projectRequestId for organization
        const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "");
        const key = `projects/${projectRequestId}/${uuidv4()}-${sanitizedName}`;

        const command = new PutObjectCommand({
            Bucket: BUCKET_PRIVATE,
            Key: key,
            ContentType: contentType
        });

        const url = await getSignedUrl(s3Client, command, { expiresIn: 60 * 5 });

        return NextResponse.json({
            uploadUrl: url,
            storageKey: key
        });
    } catch (error) {
        console.error("Sign Attachment Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
