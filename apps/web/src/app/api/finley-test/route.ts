import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({ envKeys: Object.keys(process.env) });
}
