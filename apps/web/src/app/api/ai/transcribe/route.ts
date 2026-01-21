import { NextResponse } from "next/server";

export async function POST(req: Request) {
    // Mock response for now
    return NextResponse.json({
        text: "This is a simulated transcription of the audio recording. The project involves a 30-second commercial spot for a new energy drink brand. Required assets include 3D product renders and high-energy motion graphics."
    });
}
