import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }

        const { id } = await params;

        // Fetch the project with its notes and latest SOW
        const project = await db.project.findUnique({
            where: { id },
            include: {
                meetingNotes: {
                    orderBy: { createdAt: 'asc' }
                },
                sows: {
                    orderBy: { versionNumber: 'desc' },
                    take: 1
                }
            }
        });

        if (!project) return NextResponse.json({ message: "Project not found" }, { status: 404 });
        
        const latestSow = project.sows[0];
        if (!latestSow) return NextResponse.json({ message: "No existing SOW to regenerate" }, { status: 400 });

        // Build the new AI generated SOW content
        // In a real production system, this would make an API call to OpenAI.
        // For the demo, we dynamically append the notes as "Revisions".
        let newContent = latestSow.bodyRichText || "";

        if (project.meetingNotes.length > 0) {
            newContent += "\n\n## 5. Client Revisions & Notes\n";
            project.meetingNotes.forEach(note => {
                newContent += `**${note.title}** (${note.createdAt.toLocaleDateString()})\n`;
                newContent += `${note.content}\n\n`;
            });
            newContent += "*SOW dynamically updated based on recent meeting notes.*";
        }

        // Create the new SOW version
        const newSow = await db.sOW.create({
            data: {
                projectId: id,
                versionNumber: latestSow.versionNumber + 1,
                status: 'DRAFT',
                bodyRichText: newContent,
                createdById: session.user.id
            }
        });

        // Update Project status if needed
        await db.project.update({
            where: { id },
            data: { status: 'SOW_DRAFT' } // Reset to SOW_DRAFT so it can be re-approved/sent
        });

        return NextResponse.json(newSow);
    } catch (error) {
        console.error("REGENERATE_SOW_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
