import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import {
    getProjectCostCategoryLabel,
    isProjectCostCategory,
    parseProjectCostAmount,
} from "@/lib/project-costs";

type CostInput = {
    category: string;
    costName: string;
    amount: number;
    status: "UNPAID" | "PAID";
    date: Date;
};

function parseCostInput(body: unknown): { value: CostInput; error: null } | { value: null; error: string } {
    if (!body || typeof body !== "object") {
        return { value: null, error: "Invalid cost details" };
    }

    const input = body as Record<string, unknown>;
    if (!isProjectCostCategory(input.category)) {
        return { value: null, error: "Choose a valid cost category" };
    }

    const trimmedCostName = typeof input.costName === "string" ? input.costName.trim() : "";
    if (input.category === "OTHER" && !trimmedCostName) {
        return { value: null, error: "Enter a custom cost name" };
    }

    const parsedAmount = parseProjectCostAmount(input.amount);
    if (parsedAmount === null) {
        return { value: null, error: "Amount must be a positive number" };
    }

    if (typeof input.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
        return { value: null, error: "Invalid date" };
    }

    const parsedDate = new Date(`${input.date}T12:00:00.000Z`);
    if (Number.isNaN(parsedDate.getTime())) {
        return { value: null, error: "Invalid date" };
    }

    if (input.status !== "UNPAID" && input.status !== "PAID") {
        return { value: null, error: "Choose a valid payment status" };
    }

    return {
        value: {
            category: input.category,
            costName: trimmedCostName || getProjectCostCategoryLabel(input.category),
            amount: parsedAmount,
            status: input.status,
            date: parsedDate,
        },
        error: null,
    };
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { error } = await requireAdmin();
        if (error) return error;

        const { id } = await params;
        const parsedInput = parseCostInput(await req.json());
        if (!parsedInput.value) {
            return NextResponse.json({ message: parsedInput.error }, { status: 400 });
        }
        const costInput = parsedInput.value;

        const project = await db.project.findUnique({ where: { id }, select: { id: true } });
        if (!project) {
            return NextResponse.json({ message: "Project not found" }, { status: 404 });
        }

        const bill = await db.vendorBill.create({
            data: {
                projectId: id,
                category: costInput.category,
                vendorName: costInput.costName,
                amount: costInput.amount,
                status: costInput.status,
                date: costInput.date,
            },
        });

        return NextResponse.json({ success: true, bill });
    } catch (error) {
        console.error("ADD_BILL_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { error } = await requireAdmin();
        if (error) return error;

        const { id } = await params;
        const body: unknown = await req.json();
        const input = body && typeof body === "object" ? body as Record<string, unknown> : null;
        const billId = input && typeof input.billId === "string" ? input.billId : "";

        if (!billId) {
            return NextResponse.json({ message: "Missing cost item ID" }, { status: 400 });
        }

        const parsedInput = parseCostInput(body);
        if (!parsedInput.value) {
            return NextResponse.json({ message: parsedInput.error }, { status: 400 });
        }
        const costInput = parsedInput.value;

        const existingBill = await db.vendorBill.findFirst({
            where: { id: billId, projectId: id },
            select: { id: true },
        });
        if (!existingBill) {
            return NextResponse.json({ message: "Cost item not found" }, { status: 404 });
        }

        const bill = await db.vendorBill.update({
            where: { id: existingBill.id },
            data: {
                category: costInput.category,
                vendorName: costInput.costName,
                amount: costInput.amount,
                status: costInput.status,
                date: costInput.date,
            },
        });

        return NextResponse.json({ success: true, bill });
    } catch (error) {
        console.error("UPDATE_BILL_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { error } = await requireAdmin();
        if (error) return error;

        const { id } = await params;
        const body: unknown = await req.json();
        const input = body && typeof body === "object" ? body as Record<string, unknown> : null;
        const billId = input && typeof input.billId === "string" ? input.billId : "";

        if (!billId) {
            return NextResponse.json({ message: "Missing cost item ID" }, { status: 400 });
        }

        const deleted = await db.vendorBill.deleteMany({
            where: { id: billId, projectId: id },
        });

        if (deleted.count === 0) {
            return NextResponse.json({ message: "Cost item not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE_BILL_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
