import { NextResponse } from "next/server";
import { expandPromptText } from "@/lib/gemini";

export async function POST(req: Request) {
    try {
        const { prompt, apiKey } = await req.json();

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        const variations = await expandPromptText(prompt, apiKey);

        return NextResponse.json({ variations });
    } catch (error: any) {
        console.error("Expand prompt error:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to expand prompt" },
            { status: 500 }
        );
    }
}
