import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const { vendorName, amount, status, date } = body;

        if (!vendorName || !vendorName.trim()) {
            return NextResponse.json({ message: "Missing vendor name" }, { status: 400 });
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return NextResponse.json({ message: "Amount must be a positive number" }, { status: 400 });
        }

        const parsedDate = date ? new Date(date) : new Date();
        if (isNaN(parsedDate.getTime())) {
            return NextResponse.json({ message: "Invalid date" }, { status: 400 });
        }

        const bill = await db.vendorBill.create({
            data: {
                projectId: id,
                vendorName: vendorName.trim(),
                amount: parsedAmount,
                status: status || "UNPAID",
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
        const session = await getServerSession(authOptions);
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { billId } = body;

        if (!billId) {
            return NextResponse.json({ message: "Missing bill ID" }, { status: 400 });
        }

        // Delete the bill
        await db.vendorBill.delete({
            where: { id: billId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE_BILL_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
