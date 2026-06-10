import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }

        const { id } = await params;

        // Get the latest SOW
        const project = await db.project.findUnique({
            where: { id },
            include: {
                sows: {
                    orderBy: { versionNumber: 'desc' },
                    take: 1
                }
            }
        });

        if (!project || project.sows.length === 0) {
            return NextResponse.json({ message: "No SOW found to share" }, { status: 404 });
        }

        const latestSow = project.sows[0];

        // Generate a token if one doesn't exist
        let shareToken = latestSow.shareToken;
        if (!shareToken) {
            shareToken = crypto.randomBytes(16).toString("hex");
            await db.sOW.update({
                where: { id: latestSow.id },
                data: { shareToken, status: 'PUBLISHED' } // Publishing the SOW since we are sharing it
            });

            await db.project.update({
                where: { id },
                data: { status: 'SENT' } // Project is now sent to client
            });
        }

        return NextResponse.json({ shareToken });
    } catch (error) {
        console.error("SHARE_SOW_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
