import { GoogleGenAI } from "@google/genai";

const getClient = (apiKey?: string) => {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
        throw new Error("API Key not found. Please set the GEMINI_API_KEY environment variable or provide one.");
    }
    return new GoogleGenAI({ apiKey: key });
};

// Helper to strip the data:image/png;base64, prefix
const extractBase64Data = (dataUrl: string): { data: string; mimeType: string } => {
    const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error("Invalid base64 string");
    }
    return { mimeType: matches[1], data: matches[2] };
};

// Utility to pause execution
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry wrapper for API calls to handle 503 overloaded errors
const withRetry = async <T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> => {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            // Check for 503 (Service Unavailable) or generic "overloaded" message
            const isOverloaded = error?.status === 503 || error?.code === 503 || error?.message?.includes('overloaded');

            if (isOverloaded && i < maxRetries - 1) {
                // Exponential backoff: 1s, 2s, 4s... plus random jitter
                const delay = Math.pow(2, i) * 1000 + Math.random() * 500;
                console.warn(`Gemini API overloaded. Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${maxRetries})`);
                await wait(delay);
                continue;
            }
            throw error;
        }
    }
    throw lastError;
};

export const analyzeProductImage = async (imageBase64: string, apiKey?: string): Promise<string> => {
    return withRetry(async () => {
        try {
            const ai = getClient(apiKey);
            const { data, mimeType } = extractBase64Data(imageBase64);

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                // FIX: Per @google/genai guidelines, use a Content object with a `parts` array for multi-part input.
                contents: {
                    role: 'user',
                    parts: [
                        {
                            inlineData: {
                                mimeType,
                                data,
                            },
                        },
                        {
                            text: `Analyze this product image in meticulous detail for a professional commercial photoshoot. 
            Describe the physical characteristics of the product, including:
            1. Exact text, brand names, slogans, and logos visible (quote them accurately).
            2. Precise colors, materials (e.g., matte plastic, brushed metal, glass), and surface textures.
            3. Exact geometrical shape, form, and proportions.
            4. Details of packaging, caps, lids, labels, and how they relate geometrically.
            
            This description will be used as a strict specification for an image generator. The generator MUST PRESERVE these details perfectly without altering existing text, colors, shapes, or logos when placing it in a new setting. Ensure your description emphasizes the absolute necessity of maintaining the product's 1:1 original appearance.`,
                        },
                    ],
                },
            });

            if (!response) {
                return "Could not analyze product details.";
            }

            const text = response.text;
            return text || "Could not analyze product details.";
        } catch (error) {
            console.error("Analysis Error:", error);
            throw error;
        }
    });
};

export const expandPromptText = async (prompt: string, apiKey?: string): Promise<string[]> => {
    return withRetry(async () => {
        try {
            const ai = getClient(apiKey);

            const fullTextPrompt = `You are a professional product photographer and creative director. 
            The user wants to generate a product image with the following base idea: "${prompt}".
            
            Your task is to write 3 distinct, highly detailed cinematic prompts based on this idea, suitable for a text-to-image AI.
            EACH prompt must include lighting style, background environment, camera details (e.g. 8k, 35mm lens, macro), and mood.
            
            Respond ONLY with a valid JSON array of strings containing the 3 prompts. Do not include markdown formatting like \`\`\`json.
            Example format: ["Prompt 1...", "Prompt 2...", "Prompt 3..."]`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: fullTextPrompt,
            });

            if (!response || !response.text) {
                return [prompt, prompt, prompt];
            }

            // Attempt to parse JSON
            let text = response.text.trim();
            // Remove markdown format if it slipped in
            if (text.startsWith("```json")) {
                text = text.replace(/```json/g, "").replace(/```/g, "").trim();
            } else if (text.startsWith("```")) {
                text = text.replace(/```/g, "").trim();
            }

            try {
                const parsed = JSON.parse(text);
                if (Array.isArray(parsed) && parsed.length >= 3) {
                    return parsed.slice(0, 3);
                }
            } catch (e) {
                console.error("Failed to parse expanded prompts JSON:", text);
            }

            // Fallback if parsing fails but text exists, split by lines or return the raw string as best effort
            const fallbackPrompts = text.split('\n').filter(p => p.trim().length > 10).slice(0, 3);
            if (fallbackPrompts.length === 3) return fallbackPrompts;

            return [prompt, prompt, prompt]; // Ultimate fallback
        } catch (error) {
            console.error("Expand Prompt Error:", error);
            throw error;
        }
    });
};

export const generateProductScene = async (
    originalImageBase64: string,
    productDescription: string,
    scenePrompt: string,
    model: string,
    aspectRatio: string,
    creativeMode: boolean = false,
    apiKey?: string,
    referenceImageBase64?: string | null,
    imageSize?: string
): Promise<{ imageUrl: string, fullPrompt: string }> => {
    return withRetry(async () => {
        try {
            const ai = getClient(apiKey);
            const { data, mimeType } = extractBase64Data(originalImageBase64);

            // Make sure aspect ratio is supported by Imagen 3
            let finalAspectRatio = aspectRatio;
            if (aspectRatio === "4:5") finalAspectRatio = "3:4";
            if (aspectRatio === "5:4") finalAspectRatio = "4:3";

            // FIX: Correctly set imageConfig for both supported image generation models.
            // `aspectRatio` is supported by both, while `imageSize` is only for `gemini-3-pro-image-preview`.
            const imageConfig: any = {
                aspectRatio: finalAspectRatio,
            };
            if (model === 'gemini-3-pro-image-preview') {
                imageConfig.imageSize = imageSize || "1K";
            }
            const config = { imageConfig };

            const parts: any[] = [];

            // If we have a reference scene, it should be the FIRST image so that image-to-image treats it as the base to edit.
            let productInstructionIndex = "FIRST";
            let sceneInstructionIndex = "N/A";

            if (referenceImageBase64) {
                productInstructionIndex = "SECOND";
                sceneInstructionIndex = "FIRST";

                const ref = extractBase64Data(referenceImageBase64);
                parts.push({ text: "SCENE/ENVIRONMENT REFERENCE (Base Image):" });
                parts.push({
                    inlineData: {
                        mimeType: ref.mimeType,
                        data: ref.data,
                    }
                });
            }

            // Product Image
            parts.push({ text: "PRODUCT SUBJECT REFERENCE (Absolute Source of Truth for Product):" });
            parts.push({
                inlineData: {
                    mimeType,
                    data,
                }
            });

            const fullTextPrompt = `Create a professional product photoshoot image.
            
You are a master product photographer and digital composite artist. Your task is to generate a realistic photoshoot scene and seamlessly place the provided product into it.

${referenceImageBase64 ? `SCENE REFERENCE INSTRUCTIONS:
- You must use the SCENE REFERENCE IMAGE (the ${sceneInstructionIndex} image) as your base.
- Match its exact lighting, shadow direction, camera angle, and environment.
- Replace the main subject/object in the scene with the user's product.` : `SCENE INSTRUCTIONS:
- Generate the following environment: "${scenePrompt}"`}

PRODUCT CONSISTENCY INSTRUCTIONS (CRITICAL):
- The PRODUCT IMAGE (the ${productInstructionIndex} image) is your absolute source of truth for the product's appearance.
- Ensure the product is placed naturally into the scene.
- ZERO HALLUCINATION POLICY on the product: You must perfectly preserve the exact shape, typography, logos, and materials from the PRODUCT IMAGE.
- Do not warp, crop, or reinvent the product. It must remain 100% legible and identical to the reference.
${creativeMode
                    ? "- CREATIVE FREEDOM: You may choose dynamic camera angles and scale to fit the scene vibe, but the product itself must remain undistorted."
                    : "- STRICT PLACEMENT: Ensure the entire product is fully visible and authentically structured in the center of the frame."
                }
- Adjust the ambient lighting, reflections, and shadows on the product so it blends realistically into the new environment.

PRODUCT DETAILS FOR CONTEXT:
${productDescription}`;

            parts.push({
                text: fullTextPrompt,
            });

            const response = await ai.models.generateContent({
                model: model,
                // FIX: Per @google/genai guidelines, use a Content object with a `parts` array for multi-part input.
                contents: {
                    role: 'user',
                    parts: parts,
                },
                config: config,
            });

            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    const mimeType = part.inlineData.mimeType || 'image/jpeg';
                    return {
                        imageUrl: `data:${mimeType};base64,${part.inlineData.data}`,
                        fullPrompt: fullTextPrompt
                    };
                }
            }

            throw new Error("No image generated.");
        } catch (error) {
            console.error("Generation Error:", error);
            throw error;
        }
    });
};
