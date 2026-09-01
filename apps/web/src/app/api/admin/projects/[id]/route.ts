import { NextResponse } from "next/server";
import { DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { BUCKET_PRIVATE, s3Client } from "@/lib/storage";

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { error } = await requireAdmin();
    if (error) {
        return error;
    }

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
    const { error } = await requireAdmin();
    if (error) {
        return error;
    }

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

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { error } = await requireAdmin();
    if (error) {
        return error;
    }

    try {
        const { id } = await params;
        const project = await db.project.findUnique({
            where: { id },
            select: {
                status: true,
                attachments: {
                    select: { storageKey: true }
                }
            }
        });

        if (!project) {
            return NextResponse.json({ message: "Project not found" }, { status: 404 });
        }

        if (project.status !== "CANCELLED") {
            return NextResponse.json({ message: "Only cancelled projects can be permanently deleted" }, { status: 409 });
        }

        await db.$transaction(async (tx) => {
            const sows = await tx.sOW.findMany({
                where: { projectId: id },
                select: { id: true }
            });
            const sowIds = sows.map((sow) => sow.id);

            if (sowIds.length > 0) {
                await tx.clientResponse.deleteMany({ where: { sowId: { in: sowIds } } });
            }

            // Delete every dependent record explicitly so older database constraints
            // without cascading deletes cannot leave cancelled projects undeletable.
            await tx.transcript.deleteMany({ where: { projectId: id } });
            await tx.projectAttachment.deleteMany({ where: { projectRequestId: id } });
            await tx.quote.deleteMany({ where: { projectRequestId: id } });
            await tx.answer.deleteMany({ where: { projectId: id } });
            await tx.meetingRecording.deleteMany({ where: { projectId: id } });
            await tx.adminReview.deleteMany({ where: { projectId: id } });
            await tx.sOW.deleteMany({ where: { projectId: id } });
            await tx.routingLog.deleteMany({ where: { projectId: id } });
            await tx.vendorBill.deleteMany({ where: { projectId: id } });
            await tx.invoice.deleteMany({ where: { projectId: id } });
            await tx.meetingNote.deleteMany({ where: { projectId: id } });
            await tx.project.delete({ where: { id } });
        });

        const attachmentKeys = project.attachments.map((attachment) => attachment.storageKey).filter(Boolean);
        let attachmentsDeleted = attachmentKeys.length === 0;

        if (attachmentKeys.length > 0 && BUCKET_PRIVATE) {
            try {
                await s3Client.send(new DeleteObjectsCommand({
                    Bucket: BUCKET_PRIVATE,
                    Delete: {
                        Objects: attachmentKeys.map((Key) => ({ Key })),
                        Quiet: true
                    }
                }));
                attachmentsDeleted = true;
            } catch (storageError) {
                console.error("DELETE_PROJECT_ATTACHMENTS_ERROR", storageError);
            }
        }

        return NextResponse.json({ success: true, attachmentsDeleted });
    } catch (error) {
        console.error("DELETE_PROJECT_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
