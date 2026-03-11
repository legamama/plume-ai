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

        const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: 'v1alpha' } });
        const modelsToTest = [
            'gemini-1.5-flash',
            'gemini-1.5-flash-8b',
            'gemini-1.5-pro',
            'gemini-2.5-flash',
            'gemini-1.0-pro'
        ];

        let successfulModel = null;
        let lastError = null;

        for (const model of modelsToTest) {
            try {
                const response = await ai.models.generateContent({
                    model: model,
                    contents: { role: 'user', parts: [{ text: "Hello" }] }
                });
                if (response) {
                    successfulModel = model;
                    break;
                }
            } catch (error: any) {
                console.warn(`Model ${model} failed:`, error?.message);
                lastError = error;
            }
        }

        if (!successfulModel) {
            throw lastError || new Error("No response from Gemini API");
        }

        return NextResponse.json({ success: true, message: `Connection successful using model: ${successfulModel}` });
    } catch (error: any) {
        console.error("Test connection error:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to connect to Gemini API" },
            { status: 500 }
        );
    }
}
