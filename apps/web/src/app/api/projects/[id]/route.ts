import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const project = await db.project.findUnique({
            where: { id: params.id },
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

        // Inject 'name' alias for title if needed
        const response = {
            ...project,
            name: project.title
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error("GET_PROJECT_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { name, answers } = body;

        // First delete existing answers if we are replacing them? 
        // Or upsert? Mobile sends full set usually.
        // Simplest is delete all for this project and recreate (transaction).

        const update = await db.$transaction([
            db.answer.deleteMany({ where: { projectId: params.id } }),
            db.project.update({
                where: { id: params.id },
                data: {
                    title: name,
                    status: 'DRAFT', // Reset status on edit? Or keep?
                    answers: {
                        create: Object.entries(answers || {}).map(([qId, val]) => ({
                            questionId: qId,
                            valueText: typeof val === 'string' ? val : JSON.stringify(val),
                            valueJson: typeof val === 'object' ? JSON.stringify(val) : null
                        }))
                    }
                }
            })
        ]);

        return NextResponse.json(update[1]);
    } catch (error) {
        console.error("UPDATE_PROJECT_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        await db.project.delete({
            where: { id: params.id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE_PROJECT_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
