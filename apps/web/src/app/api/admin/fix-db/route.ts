import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";

export async function POST() {
    const { error } = await requireAdmin();
    if (error) {
        return error;
    }

    try {
        console.log("Starting manual migration...");

        // 1. Add resetToken column
        await db.$executeRawUnsafe(`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "resetToken" TEXT;
    `);

        // 2. Add resetTokenExpiry column
        await db.$executeRawUnsafe(`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3);
    `);

        // 3. Add the editable project job name while preserving the original intake title.
        await db.$executeRawUnsafe(`
      ALTER TABLE "Project"
      ADD COLUMN IF NOT EXISTS "jobName" TEXT;
    `);

        return NextResponse.json({
            success: true,
            message: "Database schema is up to date."
        });
    } catch (error: any) {
        console.error("Migration failed:", error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
