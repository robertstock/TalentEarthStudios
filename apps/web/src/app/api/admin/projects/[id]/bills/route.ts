import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import {
    getProjectCostCategoryLabel,
    isProjectCostCategory,
} from "@/lib/project-costs";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { error } = await requireAdmin();
        if (error) return error;

        const { id } = await params;
        const body = await req.json();
        const { costName, category, amount, status, date } = body;

        if (!isProjectCostCategory(category)) {
            return NextResponse.json({ message: "Choose a valid cost category" }, { status: 400 });
        }

        const trimmedCostName = typeof costName === "string" ? costName.trim() : "";
        if (category === "OTHER" && !trimmedCostName) {
            return NextResponse.json({ message: "Enter a custom cost name" }, { status: 400 });
        }

        const parsedAmount = Number(amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            return NextResponse.json({ message: "Amount must be a positive number" }, { status: 400 });
        }

        if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return NextResponse.json({ message: "Invalid date" }, { status: 400 });
        }

        const parsedDate = new Date(`${date}T12:00:00.000Z`);
        if (isNaN(parsedDate.getTime())) {
            return NextResponse.json({ message: "Invalid date" }, { status: 400 });
        }

        if (status !== "UNPAID" && status !== "PAID") {
            return NextResponse.json({ message: "Choose a valid payment status" }, { status: 400 });
        }

        const project = await db.project.findUnique({ where: { id }, select: { id: true } });
        if (!project) {
            return NextResponse.json({ message: "Project not found" }, { status: 404 });
        }

        const bill = await db.vendorBill.create({
            data: {
                projectId: id,
                category,
                vendorName: trimmedCostName || getProjectCostCategoryLabel(category),
                amount: parsedAmount,
                status,
                date: parsedDate
            }
        });

        return NextResponse.json({ success: true, bill });
    } catch (error) {
        console.error("ADD_BILL_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { error } = await requireAdmin();
        if (error) return error;

        const body = await req.json();
        const { billId } = body;

        if (!billId) {
            return NextResponse.json({ message: "Missing bill ID" }, { status: 400 });
        }

        const deleted = await db.vendorBill.deleteMany({
            where: { id: billId, projectId: id }
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
