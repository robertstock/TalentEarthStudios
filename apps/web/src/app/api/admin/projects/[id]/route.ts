import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

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
        console.log(`[ADMIN] POST /projects/${id} Body:`, body);
        const { decision, comments } = body;

        if (!decision) {
            console.error("[ADMIN] Missing 'decision' in request body");
            return NextResponse.json({ message: "Missing decision" }, { status: 400 });
        }

        let adminUser = await db.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!adminUser) {
            console.log("No admin user found. Creating backup admin for review.");
            try {
                adminUser = await db.user.create({
                    data: {
                        email: 'admin@finley.com',
                        firstName: 'Admin',
                        lastName: 'User',
                        role: 'ADMIN'
                    }
                });
            } catch (e) {
                // Fallback if create fails (e.g. unique constraint race condition)
                adminUser = await db.user.findFirst();
            }
        }

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
            console.log(`[ADMIN] Approved project ${id}. Status updated to APPROVED_FOR_SOW`);
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
