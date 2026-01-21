import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const filename = searchParams.get("filename");

    if (!filename) {
        return NextResponse.json({ error: "Filename required" }, { status: 400 });
    }

    try {
        const fileData = await req.arrayBuffer();
        if (!fileData || fileData.byteLength === 0) {
            return NextResponse.json({ error: "Empty file body" }, { status: 400 });
        }

        const buffer = Buffer.from(fileData);

        // Ensure directory exists: public/uploads/profiles
        const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");

        // Recursive true ensures parent directories are created if missing
        await mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, filename);
        await writeFile(filePath, buffer);

        console.log(`Saved local file to ${filePath}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Local upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
