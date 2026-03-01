import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
    try {
        const { apiKey } = await req.json();

        if (!apiKey) {
            return NextResponse.json(
                { error: "API Key is required" },
                { status: 400 }
            );
        }

        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: {
                role: 'user',
                parts: [{ text: "Hello" }]
            }
        });

        if (!response) {
            throw new Error("No response from Gemini API");
        }

        return NextResponse.json({ success: true, message: "Connection successful" });
    } catch (error: any) {
        console.error("Test connection error:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to connect to Gemini API" },
            { status: 500 }
        );
    }
}
