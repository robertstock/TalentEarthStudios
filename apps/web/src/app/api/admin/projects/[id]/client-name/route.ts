import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { resolveProjectClientName } from "@/lib/project-client";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { error, session } = await requireAdmin();
        if (error) return error;

        const { id } = await params;
        const body = await req.json();
        const clientName = body.clientName;

        if (clientName !== null && typeof clientName !== "string") {
            return NextResponse.json({ message: "Enter a valid client name" }, { status: 400 });
        }

        const trimmedClientName = typeof clientName === "string" ? clientName.trim() : null;
        if (trimmedClientName !== null && (trimmedClientName.length === 0 || trimmedClientName.length > 160)) {
            return NextResponse.json(
                { message: "Client name must be between 1 and 160 characters" },
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
            data: { clientNameOverride: trimmedClientName },
            select: {
                id: true,
                clientNameOverride: true,
                client: { select: { companyName: true, email: true } },
            },
        });

        return NextResponse.json({
            success: true,
            clientName: resolveProjectClientName({
                clientNameOverride: project.clientNameOverride,
                linkedClientName: project.client?.companyName,
                linkedClientEmail: project.client?.email,
                administratorEmail: session?.user?.email,
            }),
        });
    } catch (error) {
        console.error("UPDATE_PROJECT_CLIENT_NAME_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
