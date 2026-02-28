import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
dotenv.config({ path: '.env.local' });

async function run() {
    console.log("Testing GenAI...");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        const response = await ai.models.generateImages({
            model: 'gemini-3-pro-image-preview',
            prompt: 'A cute cat on a table',
            config: { numberOfImages: 1 }
        });
        console.log("Success:", !!response.generatedImages?.length);
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}
run();
