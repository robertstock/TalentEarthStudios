import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { error } = await requireAdmin();
        if (error) return error;

        const { id } = await params;
        const body = await req.json();
        const jobName = body.jobName;

        if (typeof jobName !== "string") {
            return NextResponse.json({ message: "Enter a valid job name" }, { status: 400 });
        }

        const trimmedJobName = jobName.trim();
        if (trimmedJobName.length === 0 || trimmedJobName.length > 160) {
            return NextResponse.json(
                { message: "Job name must be between 1 and 160 characters" },
                { status: 400 },
            );
        }

        const existingProject = await db.project.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!existingProject) {
            return NextResponse.json({ message: "Project not found" }, { status: 404 });
        }

        const project = await db.project.update({
            where: { id },
            data: { jobName: trimmedJobName },
            select: { id: true, jobName: true },
        });

        return NextResponse.json({ success: true, jobName: project.jobName });
    } catch (error) {
        console.error("UPDATE_PROJECT_JOB_NAME_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
