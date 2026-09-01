import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { error } = await requireAdmin();
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
                client: { select: { companyName: true } },
            },
        });

        return NextResponse.json({
            success: true,
            clientName: project.clientNameOverride || project.client?.companyName || "Unknown Client",
        });
    } catch (error) {
        console.error("UPDATE_PROJECT_CLIENT_NAME_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
