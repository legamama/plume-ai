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
                            text: `Analyze this product image in high detail for a professional photographer. 
            Describe the physical characteristics of the product, including:
            1. Exact text, brand names, and logos visible (quote them).
            2. Colors, materials (e.g., matte plastic, brushed metal, glass), and textures.
            3. Shape and form.
            
            This description will be used to instruct an image generator to PRESERVE these details perfectly in a new setting.`,
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

export const generateProductScene = async (
    originalImageBase64: string,
    productDescription: string,
    scenePrompt: string,
    model: string,
    aspectRatio: string,
    apiKey?: string,
    referenceImageBase64?: string | null
): Promise<{ imageUrl: string, fullPrompt: string }> => {
    return withRetry(async () => {
        try {
            const ai = getClient(apiKey);
            const { data, mimeType } = extractBase64Data(originalImageBase64);

            // FIX: Correctly set imageConfig for both supported image generation models.
            // `aspectRatio` is supported by both, while `imageSize` is only for `gemini-3-pro-image-preview`.
            const imageConfig: any = {
                aspectRatio: aspectRatio,
            };
            if (model === 'gemini-3-pro-image-preview') {
                imageConfig.imageSize = "1K";
            }
            const config = { imageConfig };

            const fullTextPrompt = `Create a professional product photoshoot image.
            
VISUAL PRIORITY:
1. The PRIMARY source of truth for the product's appearance is the attached REFERENCE IMAGE (the first image provided).
2. The text description below is SECONDARY, provided only to help understand the product's features.

PRODUCT DESCRIPTION (Secondary):
${productDescription}

CRITICAL INSTRUCTIONS:
1. You must reproduce the product from the reference image EXACTLY. Do not redesign it.
2. Do NOT change the product's shape, text, logos, fonts, or colors. The product branding must remain sharp, legible, and identical to the reference.
3. If the text description conflicts with the visual reference, IGNORE the text and follow the image.
4. Place this exact product into the following scene: "${scenePrompt}".
5. Adjust the lighting and reflections on the product to match the new environment naturally, but do not distort the product itself.
6. The result should look like a high-end commercial photograph.`;

            const parts: any[] = [
                {
                    inlineData: {
                        mimeType,
                        data,
                    },
                },
                {
                    text: fullTextPrompt,
                },
            ];

            // Add reference model image if provided
            if (referenceImageBase64) {
                const ref = extractBase64Data(referenceImageBase64);
                parts.unshift({
                    inlineData: {
                        mimeType: ref.mimeType,
                        data: ref.data,
                    },
                });
            }

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
                    return {
                        imageUrl: `data:image/png;base64,${part.inlineData.data}`,
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
