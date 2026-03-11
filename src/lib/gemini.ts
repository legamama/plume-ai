import { GoogleGenAI } from "@google/genai";

const getClient = (apiKey?: string) => {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
        throw new Error("API Key not found. Please set the GEMINI_API_KEY environment variable or provide one.");
    }
    // Use v1alpha API version — required for image generation models like
    // gemini-3-pro-image-preview and gemini-3.1-flash-image-preview.
    // The default v1beta does NOT support these models, causing 404 errors
    // on deployed environments (Vercel/Netlify).
    return new GoogleGenAI({ apiKey: key, httpOptions: { apiVersion: 'v1alpha' } });
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
const withRetry = async <T>(operation: () => Promise<T>, maxRetries = 5): Promise<T> => {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;
            // Check for 503 (Service Unavailable) or generic "overloaded" / "high demand" message
            const isOverloaded = error?.status === 503 || error?.code === 503 ||
                error?.message?.includes('overloaded') || error?.message?.includes('high demand') ||
                error?.message?.includes('UNAVAILABLE');

            if (isOverloaded && i < maxRetries - 1) {
                // Exponential backoff: 3s, 6s, 12s, 24s... plus random jitter
                const delay = Math.pow(2, i) * 3000 + Math.random() * 1000;
                console.warn(`Gemini API overloaded. Retrying in ${Math.round(delay / 1000)}s... (Attempt ${i + 1}/${maxRetries})`);
                await wait(delay);
                continue;
            }
            throw error;
        }
    }
    throw lastError;
};

// Fallback logic for basic text/vision generation to handle varying API key access levels
const generateWithFallback = async (ai: any, baseConfig: any) => {
    const fallbacks = [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
    ];
    let lastError: any = null;

    for (const model of fallbacks) {
        try {
            const response = await ai.models.generateContent({
                ...baseConfig,
                model
            });
            if (response) return response;
        } catch (error: any) {
            console.warn(`[Fallback Warning] Model ${model} failed:`, error?.message);
            lastError = error;
        }
    }
    throw lastError || new Error("All fallback generation models failed.");
};

export const analyzeProductImage = async (imageBase64: string, apiKey?: string): Promise<string> => {
    return withRetry(async () => {
        try {
            const ai = getClient(apiKey);
            const { data, mimeType } = extractBase64Data(imageBase64);

            const response = await generateWithFallback(ai, {
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
                            text: `You are a product photography expert. Analyze this product image with extreme precision for use in AI image generation.

Provide your analysis in the following structured format:

**PRODUCT TYPE:** [What the product is, e.g. "glass bottle of perfume", "matte black wireless earbuds case"]

**TEXT & LOGOS:**
- List every piece of visible text, brand name, slogan, barcode exactly as written
- Describe placement, font style, and size relative to the product
- Note: "[exact text]" on [location] in [color] [font description]

**COLORS & MATERIALS:**
- Primary color(s) with specific shades (e.g. "deep emerald green", not just "green")
- Material type and surface finish (e.g. "frosted glass with matte finish", "brushed aluminum")
- How the material interacts with light (reflective, translucent, opaque, matte, glossy)

**SHAPE & GEOMETRY:**
- Overall form factor and proportions
- Key structural features (caps, lids, curves, edges, handles)
- Approximate proportions/ratios between parts

**MUST NOT CHANGE (Critical Constraints):**
- List specific elements that must remain EXACTLY as-is in any generated image
- Example: "The gold logo 'BRAND' on the front must remain perfectly legible"
- Example: "The transparent glass body must remain transparent with visible liquid inside"
- Example: "The red cap-to-body ratio must be preserved"

Be extremely specific. This description will be used as the authoritative specification to prevent hallucination in image generation.`,
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

export const expandPromptText = async (prompt: string, apiKey?: string, productAnalysis?: string): Promise<string[]> => {
    return withRetry(async () => {
        try {
            const ai = getClient(apiKey);

            const productContext = productAnalysis
                ? `\n\nIMPORTANT CONTEXT - The product being photographed has these characteristics:\n${productAnalysis.substring(0, 500)}\n\nYour prompts should describe environments that COMPLEMENT this product. Do NOT describe the product itself in your prompts — only describe the scene, lighting, and atmosphere around it.`
                : '';

            const fullTextPrompt = `You are a professional product photographer and creative director. 
            The user wants to generate a product image with the following base idea: "${prompt}".
            ${productContext}
            
            Your task is to write 3 distinct, highly detailed cinematic SCENE prompts based on this idea, suitable for a text-to-image AI.
            EACH prompt must describe ONLY the environment/scene (NOT the product itself) and include:
            1. Lighting style (e.g., global illumination, volumetric lighting, caustics, softbox, harsh sunlight with specific color temperature).
            2. Background environment with specific materials, textures, and props.
            3. Camera details (e.g. 8K, 35mm lens, macro, shallow depth of field, eye-level angle).
            4. Mood, atmosphere, and color palette of the scene.
            
            Make each prompt distinctly different in mood and setting while staying relevant to the base idea.
            
            Respond ONLY with a valid JSON array of strings containing the 3 prompts. Do not include markdown formatting like \`\`\`json.
            Example format: ["Prompt 1...", "Prompt 2...", "Prompt 3..."]`;

            const response = await generateWithFallback(ai, {
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
            const fallbackPrompts = text.split('\n').filter((p: string) => p.trim().length > 10).slice(0, 3);
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
    imageSize?: string,
    quality: 'pro' | 'flash' = 'flash'
): Promise<{ imageUrl: string, fullPrompt: string }> => {
    return withRetry(async () => {
        try {
            const ai = getClient(apiKey);
            const { data, mimeType } = extractBase64Data(originalImageBase64);

            // Model Selection based on Quality Toggle. Note: Google currently only provides the pro version via API for Imagen 3.
            const targetModel = 'gemini-3-pro-image-preview';

            // Make sure aspect ratio is supported by Imagen 3
            let finalAspectRatio = aspectRatio;
            if (aspectRatio === "4:5") finalAspectRatio = "3:4";
            if (aspectRatio === "5:4") finalAspectRatio = "4:3";

            // FIX: Correctly set imageConfig for both supported image generation models.
            // `aspectRatio` is supported by both, while `imageSize` is only for `gemini-3-pro-image-preview`.
            const imageConfig: any = {
                aspectRatio: finalAspectRatio,
            };
            if (targetModel === 'gemini-3-pro-image-preview') {
                imageConfig.imageSize = imageSize || "1K";
            }
            const config = { imageConfig };

            const parts: any[] = [];

            // === CONCISE CAPTION-STYLE PROMPT ===
            // Image generation models work best with short, descriptive photography captions.
            // Long instruction lists dilute attention away from the reference image.
            // BUT: we preserve the user's full scene/custom details — only the meta-instructions are kept short.
            let fullTextPrompt: string;

            if (referenceImageBase64) {
                // Scene reference mode: composite product into scene
                fullTextPrompt = `Edit this image: place the exact product from the first photo into the scene from the second photo. Keep every detail, label, color, and shape of the product identical to the reference. Professional product photography, realistic lighting and shadows.`;
            } else {
                // Standard mode: generate scene around product
                const cameraStyle = creativeMode
                    ? "dynamic cinematic angle, creative composition"
                    : "professional commercial photography, eye-level product shot";

                fullTextPrompt = `Professional product photoshoot: place this exact product in the following scene setting — ${scenePrompt}. Keep the product IDENTICAL to the reference photo — same shape, colors, labels, text, and proportions. ${cameraStyle}, realistic lighting with natural shadows and reflections, 8K quality.`;
            }

            // PART ORDER: Product image FIRST (strongest visual anchor), then brief text instruction.
            // The model should "see" the product before reading what to do with it.
            parts.push({
                inlineData: {
                    mimeType,
                    data,
                }
            });

            // Optional: Scene reference image
            if (referenceImageBase64) {
                const ref = extractBase64Data(referenceImageBase64);
                parts.push({
                    inlineData: {
                        mimeType: ref.mimeType,
                        data: ref.data,
                    }
                });
            }

            // Text prompt LAST and SHORT — this is a caption, not an instruction manual
            parts.push({
                text: fullTextPrompt,
            });

            // Image generation models to try in order of preference
            const IMAGE_MODELS = [
                'gemini-3-pro-image-preview',
                'gemini-3.1-flash-image-preview',
                'gemini-2.5-flash-image',
                'gemini-2.0-flash-preview-image-generation',
            ];

            let lastModelError: any = null;
            for (const currentModel of IMAGE_MODELS) {
                try {
                    // imageSize is only supported by gemini-3-pro-image-preview
                    const modelConfig: any = { imageConfig: { aspectRatio: finalAspectRatio } };
                    if (currentModel === 'gemini-3-pro-image-preview') {
                        modelConfig.imageConfig.imageSize = imageSize || "1K";
                    }

                    console.log(`[Image Gen] Trying model: ${currentModel}`);
                    const response = await ai.models.generateContent({
                        model: currentModel,
                        contents: {
                            role: 'user',
                            parts: parts,
                        },
                        config: modelConfig,
                    });

                    for (const part of response.candidates?.[0]?.content?.parts || []) {
                        if (part.inlineData) {
                            const mimeType = part.inlineData.mimeType || 'image/jpeg';
                            console.log(`[Image Gen] Success with model: ${currentModel}`);
                            return {
                                imageUrl: `data:${mimeType};base64,${part.inlineData.data}`,
                                fullPrompt: fullTextPrompt
                            };
                        }
                    }
                    throw new Error("No image in response.");
                } catch (modelError: any) {
                    lastModelError = modelError;
                    const isRetryable = modelError?.status === 503 || modelError?.code === 503 ||
                        modelError?.status === 404 || modelError?.code === 404 ||
                        modelError?.message?.includes('503') || modelError?.message?.includes('UNAVAILABLE') ||
                        modelError?.message?.includes('404') || modelError?.message?.includes('NOT_FOUND') ||
                        modelError?.message?.includes('is not found') ||
                        modelError?.message?.includes('high demand') || modelError?.message?.includes('overloaded');

                    if (isRetryable && currentModel !== IMAGE_MODELS[IMAGE_MODELS.length - 1]) {
                        console.warn(`[Image Gen] Model ${currentModel} failed (${modelError?.status || 'unknown'}), falling back to next model...`);
                        continue;
                    }
                    throw modelError;
                }
            }

            throw lastModelError || new Error("No image generated.");
        } catch (error) {
            console.error("Generation Error:", error);
            throw error;
        }
    });
};

export const cleanSceneImage = async (imageBase64: string, apiKey?: string, quality: 'pro' | 'flash' = 'flash'): Promise<{ imageUrl: string }> => {
    return withRetry(async () => {
        try {
            const ai = getClient(apiKey);
            const { data, mimeType } = extractBase64Data(imageBase64);

            const IMAGE_MODELS = [
                'gemini-3-pro-image-preview',
                'gemini-3.1-flash-image-preview',
                'gemini-2.5-flash-image',
                'gemini-2.0-flash-preview-image-generation',
            ];

            const prompt = `You are an expert retoucher. Completely erase and remove any primary product subjects, objects, texts, brands, and logos from this image. Seamlessly reconstruct the background and environment to create an empty, pristine, and clean scene. Preserve all original lighting, reflections, shadows, and the overall atmospheric environment flawlessly. Provide an empty background.`;

            const contentParts = [
                { text: "INSTRUCTIONS: " + prompt },
                { text: "ORIGINAL IMAGE:" },
                { inlineData: { mimeType, data } }
            ];

            let lastModelError: any = null;
            for (const currentModel of IMAGE_MODELS) {
                try {
                    console.log(`[Clean Scene] Trying model: ${currentModel}`);
                    const response = await ai.models.generateContent({
                        model: currentModel,
                        contents: { role: 'user', parts: contentParts },
                        config: { imageConfig: { aspectRatio: "1:1" } }
                    });

                    for (const part of response.candidates?.[0]?.content?.parts || []) {
                        if (part.inlineData) {
                            const returnedMimeType = part.inlineData.mimeType || 'image/jpeg';
                            return { imageUrl: `data:${returnedMimeType};base64,${part.inlineData.data}` };
                        }
                    }
                    throw new Error("No image in response.");
                } catch (modelError: any) {
                    lastModelError = modelError;
                    const isRetryable = modelError?.status === 503 || modelError?.code === 503 ||
                        modelError?.status === 404 || modelError?.code === 404 ||
                        modelError?.message?.includes('503') || modelError?.message?.includes('UNAVAILABLE') ||
                        modelError?.message?.includes('404') || modelError?.message?.includes('NOT_FOUND') ||
                        modelError?.message?.includes('is not found') ||
                        modelError?.message?.includes('high demand') || modelError?.message?.includes('overloaded');
                    if (isRetryable && currentModel !== IMAGE_MODELS[IMAGE_MODELS.length - 1]) {
                        console.warn(`[Clean Scene] Model ${currentModel} failed (${modelError?.status || 'unknown'}), falling back...`);
                        continue;
                    }
                    throw modelError;
                }
            }
            throw lastModelError || new Error("No image generated.");
        } catch (error) {
            console.error("Clean Scene Error:", error);
            throw error;
        }
    });
};

export const generateSceneVariations = async (imageBase64: string, count: number, apiKey?: string, quality: 'pro' | 'flash' = 'flash'): Promise<{ imageUrls: string[] }> => {
    return withRetry(async () => {
        try {
            const ai = getClient(apiKey);
            const { data, mimeType } = extractBase64Data(imageBase64);

            const IMAGE_MODELS = [
                'gemini-3-pro-image-preview',
                'gemini-3.1-flash-image-preview',
                'gemini-2.5-flash-image',
                'gemini-2.0-flash-preview-image-generation',
            ];

            const prompt = `Using this empty scene as a strict reference, generate a variation of this environment. Maintain the exact lighting temperature, angle, and core composition, but subtly alter the surface materials, background props, and textures to create a fresh yet highly consistent architectural or natural setting. Do NOT add any products or main subjects.`;

            const generateOneVariation = async () => {
                let lastModelError: any = null;
                for (const currentModel of IMAGE_MODELS) {
                    try {
                        const response = await ai.models.generateContent({
                            model: currentModel,
                            contents: {
                                role: 'user',
                                parts: [
                                    { text: prompt },
                                    { inlineData: { mimeType, data } }
                                ],
                            }
                        });
                        for (const part of response.candidates?.[0]?.content?.parts || []) {
                            if (part.inlineData) {
                                const returnedMimeType = part.inlineData.mimeType || 'image/jpeg';
                                return `data:${returnedMimeType};base64,${part.inlineData.data}`;
                            }
                        }
                        throw new Error("No image in response.");
                    } catch (modelError: any) {
                        lastModelError = modelError;
                        const isRetryable = modelError?.status === 503 || modelError?.code === 503 ||
                            modelError?.status === 404 || modelError?.code === 404 ||
                            modelError?.message?.includes('503') || modelError?.message?.includes('UNAVAILABLE') ||
                            modelError?.message?.includes('404') || modelError?.message?.includes('NOT_FOUND') ||
                            modelError?.message?.includes('is not found') ||
                            modelError?.message?.includes('high demand') || modelError?.message?.includes('overloaded');
                        if (isRetryable && currentModel !== IMAGE_MODELS[IMAGE_MODELS.length - 1]) {
                            continue;
                        }
                        throw modelError;
                    }
                }
                throw lastModelError || new Error("No image generated.");
            };

            const promises = Array.from({ length: count }).map(() => generateOneVariation());
            const results = await Promise.allSettled(promises);

            const imageUrls = results
                .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
                .map(r => r.value);

            if (imageUrls.length === 0) throw new Error("Could not generate any variations.");

            return { imageUrls };
        } catch (error) {
            console.error("Generate Variations Error:", error);
            throw error;
        }
    });
};
