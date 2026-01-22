import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const project = await db.project.findUnique({
            where: { id },
            include: {
                category: true,
                answers: { include: { question: true } },
                recordings: true,
                client: true,
                createdBy: true,
                adminReviews: {
                    include: { reviewer: true },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!project) return NextResponse.json({ message: "Project not found" }, { status: 404 });

        return NextResponse.json(project);
    } catch (error) {
        console.error("GET_ADMIN_PROJECT_ERROR", error);
        return NextResponse.json({
            message: "Internal server error",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { decision, comments } = body;

        // Find default admin user for reviewer
        const adminUser = await db.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (decision === 'APPROVED') {
            await db.project.update({
                where: { id },
                data: {
                    status: 'APPROVED_FOR_SOW',
                    adminReviews: {
                        create: {
                            decision: 'APPROVED',
                            comments: comments || 'Approved',
                            reviewerId: adminUser?.id || ''
                        }
                    }
                }
            });
        } else if (decision === 'CHANGES_REQUESTED') {
            await db.project.update({
                where: { id },
                data: {
                    status: 'NEEDS_RPM_UPDATE',
                    adminReviews: {
                        create: {
                            decision: 'CHANGES_REQUESTED',
                            comments: comments,
                            reviewerId: adminUser?.id || ''
                        }
                    }
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("ADMIN_ACTION_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await db.project.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE_PROJECT_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
