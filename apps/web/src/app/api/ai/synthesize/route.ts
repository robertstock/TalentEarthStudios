import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const body = await req.json();
    const { transcript } = body;

    // Mock analysis
    const analysis = `AI Analysis: Based on the transcript, the project scope includes: 3D Product Rendering, Motion Graphics, and Commercial Video Production. Estimated timeline: 4 weeks.`;

    return NextResponse.json({
        analysis: analysis
    });
}
