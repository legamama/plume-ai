import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("GEMINI_API_KEY not found in .env.local");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        const result = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // dummy to check client
        // Actually, listModels is on the genAI instance in some versions or requires a different approach.
        // In @google/generative-ai, there isn't a simple listModels on the client.
        // Wait, yes there is. No, it's not.

        console.log("Attempting to check gemini-2.0-flash availability...");
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const test = await model.generateContent("test");
            console.log("gemini-2.0-flash is AVAILABLE");
        } catch (e: any) {
            console.log("gemini-2.0-flash is NOT AVAILABLE:", e.message);
        }

        console.log("Attempting to check gemini-2.0-flash-exp availability...");
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
            const test = await model.generateContent("test");
            console.log("gemini-2.0-flash-exp is AVAILABLE");
        } catch (e: any) {
            console.log("gemini-2.0-flash-exp is NOT AVAILABLE:", e.message);
        }

        console.log("Attempting to check gemini-1.5-flash availability...");
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const test = await model.generateContent("test");
            console.log("gemini-1.5-flash is AVAILABLE");
        } catch (e: any) {
            console.log("gemini-1.5-flash is NOT AVAILABLE:", e.message);
        }

    } catch (error) {
        console.error("Error checking models:", error);
    }
}

listModels();
