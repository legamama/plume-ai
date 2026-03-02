import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("GEMINI_API_KEY not found in .env.local");
    process.exit(1);
}

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log("AVAILABLE MODELS (supporting generateContent):");
            const geminiModels = data.models.filter((m: any) =>
                m.name.includes("gemini") &&
                m.supportedGenerationMethods?.includes("generateContent")
            );

            for (const model of geminiModels) {
                console.log(`- ${model.name}`);
            }
        } else {
            console.error("Failed to fetch models:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Error:", e);
    }
}
listModels();
