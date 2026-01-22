import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const project = await db.project.findUnique({
            where: { id },
            include: {
                category: true,
                answers: true,
                recordings: true,
                adminReviews: {
                    include: { reviewer: true },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!project) return NextResponse.json({ message: "Project not found" }, { status: 404 });

        // Map to format expected by mobile if needed, or mobile adapts to this schema
        // Mobile expects { name, answers: [], ... }
        // We updated schema so it should match mostly.

        const response = project;

        return NextResponse.json(response);
    } catch (error) {
        console.error("GET_PROJECT_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { name, answers, status, ...otherFields } = body;

        // Prepare update data
        const updateData: any = { ...otherFields };
        if (name) updateData.name = name; // FIXED: Schema uses 'name', not 'title'.
        if (status) updateData.status = status;

        // Remove fields that are not on Project model (description, timeline, etc.)
        // These are derived from answers and not stored on root.
        delete updateData.description;
        delete updateData.timeline;
        delete updateData.budgetRange;
        // Also remove 'title' if it was passed in otherFields
        delete updateData.title;

        // If answers are provided, handle the full form update transaction
        if (answers) {
            let processedAnswers = Object.entries(answers || {});

            // Check for fallback date ID and resolve to real ID
            try {
                const fallbackDateEntry = processedAnswers.find(([key]) => key.startsWith('q_date_fallback'));
                if (fallbackDateEntry) {
                    const currentProject = await db.project.findUnique({
                        where: { id },
                        include: { category: { include: { questionSets: { include: { questions: true } } } } }
                    });

                    // Defensive check: category might be null if integrity is off
                    if (currentProject && currentProject.category) {
                        const activeQS = currentProject.category.questionSets.find(qs => qs.active);
                        const realDateQuestion = activeQS?.questions.find(q => q.type === 'DATE' || q.prompt === 'Target Delivery Date');

                        if (realDateQuestion) {
                            processedAnswers = processedAnswers.map(([k, v]) =>
                                k.startsWith('q_date_fallback') ? [realDateQuestion.id, v] : [k, v]
                            );
                        }
                    }
                }
            } catch (resolutionError) {
                console.warn("FAILED_TO_RESOLVE_DATE_ID", resolutionError);
                // Continue without resolution (fallback ID will be filtered out below, ensuring valid save)
            }

            // Filter out invalid question IDs (must be CUIDs or resolved real IDs)
            // Invalid IDs start with 'q_' (temporary frontend IDs).
            const validAnswers = processedAnswers.filter(([qId]) => qId && !qId.startsWith('q_'));

            // If we are getting answers, it's likely a submission/resubmission
            if (!status) updateData.status = 'SUBMITTED';

            const update = await db.$transaction([
                db.answer.deleteMany({ where: { projectId: id } }),
                db.project.update({
                    where: { id },
                    data: {
                        ...updateData,
                        answers: {
                            create: validAnswers.map(([qId, val]) => {
                                // Safeguard value processing
                                const valString = typeof val === 'string' ? val : (val ? JSON.stringify(val) : null);
                                const valJson = (typeof val === 'object' && val !== null) ? JSON.stringify(val) : null;

                                return {
                                    questionId: qId,
                                    valueText: valString,
                                    valueJson: valJson
                                };
                            })
                        }
                    }
                })
            ]);
            return NextResponse.json(update[1]);
        } else {
            // Simple partial update (e.g. Admin marking isPaid)
            if (updateData.isPaid && updateData.finalRevenue) {
                updateData.paidAt = new Date();
                updateData.commissionPaid = Number(updateData.finalRevenue) * 0.20;
            }

            const project = await db.project.update({
                where: { id },
                data: updateData
            });
            return NextResponse.json(project);
        }
    } catch (error) {
        console.error("UPDATE_PROJECT_ERROR", error);
        return NextResponse.json({
            message: "Internal server error",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
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
