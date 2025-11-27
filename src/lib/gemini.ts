import { GoogleGenAI } from "@google/genai";

const getClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("API Key not found. Please set the GEMINI_API_KEY environment variable.");
    }
    return new GoogleGenAI({ apiKey });
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

export const analyzeProductImage = async (imageBase64: string): Promise<string> => {
    return withRetry(async () => {
        try {
            const ai = getClient();
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
    aspectRatio: string
): Promise<{ imageUrl: string, fullPrompt: string }> => {
    return withRetry(async () => {
        try {
            const ai = getClient();
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
            
REFERENCE IMAGE: Use the attached image as the strict visual reference for the product.

PRODUCT DETAILS TO PRESERVE (CRITICAL):
${productDescription}

INSTRUCTIONS:
1. Place the exact product shown in the reference image into the following scene: "${scenePrompt}".
2. DO NOT change the product's shape, text, logos, or colors. The product branding must remain sharp and legible.
3. Adjust the lighting and reflections on the product to match the new environment naturally, but do not distort the product itself.
4. The result should look like a high-end commercial photograph.`;

            const response = await ai.models.generateContent({
                model: model,
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
                            text: fullTextPrompt,
                        },
                    ],
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
