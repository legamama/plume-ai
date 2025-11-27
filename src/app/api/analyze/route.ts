import { NextResponse } from "next/server";
import { analyzeProductImage } from "@/lib/gemini";

export async function POST(req: Request) {
    try {
        const { image, mimeType, apiKey } = await req.json();

        if (!image || !mimeType) {
            return NextResponse.json(
                { error: "Image data and mimeType are required" },
                { status: 400 }
            );
        }

        // Reconstruct the base64 data URL
        const imageDataUrl = `data:${mimeType};base64,${image}`;

        // Use the utility function with retry logic
        const analysis = await analyzeProductImage(imageDataUrl, apiKey);

        return NextResponse.json({ analysis });
    } catch (error: any) {
        console.error("Analysis error:", error);
        console.error("Error details:", {
            message: error?.message,
            stack: error?.stack,
            apiKey: process.env.GEMINI_API_KEY ? 'Present' : 'Missing'
        });
        return NextResponse.json(
            { error: error?.message || "Failed to analyze image" },
            { status: 500 }
        );
    }
}
