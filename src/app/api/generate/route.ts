import { NextResponse } from "next/server";
import { generateProductScene } from "@/lib/gemini";

// Preset scene descriptions
const PRESET_SCENES = {
    minimalist: "Clean white studio background with professional high-key lighting, soft shadows, minimal props",
    luxury: "Elegant marble surface with dramatic lighting, premium textures like marble or velvet, elegant composition",
    nature: "Natural stone podium surrounded by greenery, organic elements like leaves, soft sunlight filtering through trees",
    neon: "Futuristic cyberpunk vibe with neon blue and pink lights, dark background, vibrant glow effects",
    cozy: "Warm, inviting wooden table setting with natural window light, cozy home interior atmosphere",
    floating: "Surreal floating composition with pastel colors (pink, lavender, mint), dreamy ethereal background",
    industrial: "Raw industrial aesthetic with concrete textures, metallic accents, dramatic shadows, and cool toned lighting",
    summer: "Bright and sunny beach scene with golden sand, clear blue sky, tropical vibes, and warm natural sunlight",
    winter: "Crisp winter scene with fresh white snow, frost details, cool blue tones, and soft diffused lighting",
    lunar: "Festive Lunar New Year theme with red and gold elements, lanterns, traditional patterns, and warm celebratory lighting",
    sale: "Commercial sale banner style with bold solid background, confetti or geometric shapes, high contrast, and space for text",
    urban: "Modern urban street scene with city architecture, asphalt textures, blurred city lights in background, and street style vibe",
    moody: "Dark and moody atmosphere with deep shadows, rich textures, spotlighting on the product, and cinematic look",
    spa: "Elegant bathroom spa setting with white marble, soft towels, water droplets, bamboo accents, and warm relaxing lighting"
};

export async function POST(req: Request) {
    try {
        console.log('Generate API: Request received');
        const { image, analysis, settings, apiKey } = await req.json();

        console.log('Generate API: Parsed request body', {
            hasImage: !!image,
            hasAnalysis: !!analysis,
            hasSettings: !!settings,
            hasApiKey: !!apiKey,
            settings: settings
        });

        if (!image || !analysis || !settings) {
            console.error('Generate API: Missing required fields', { image: !!image, analysis: !!analysis, settings: !!settings });
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Construct the scene prompt
        let scenePrompt = '';
        let referenceImageBase64 = null;

        if (settings.modelPlacement?.enabled && settings.modelPlacement.referenceImage) {
            // Model Placement Mode
            const presetScene = PRESET_SCENES[settings.preset as keyof typeof PRESET_SCENES] || PRESET_SCENES.minimalist;
            const styleContext = `
            Desired Style/Atmosphere: ${presetScene}
            ${settings.customPrompt ? `Additional Context: ${settings.customPrompt}` : ''}`;

            if (settings.modelPlacement.generateNewModel) {
                scenePrompt = `MODEL PLACEMENT & REGENERATION TASK:
                Reference Scene: Use the provided reference model image as a POSE and LIGHTING reference only.
                Task 1 (Model): Generate a NEW model (new face, new hairstyle) but STRICTLY PRESERVE the exact pose, hand gestures, and body language of the reference image. The new model should look distinct from the original to avoid copyright issues.
                Task 2 (Product): Place the analyzed product into this new model's hands/scene exactly where the original object was.
                Placement Instructions: ${settings.modelPlacement.prompt || "Replace the object naturally with the analyzed product."}
                
                Style & Atmosphere:
                - Maintain the professional lighting and composition of the reference.
                - Apply the following style influence: ${styleContext}`;
            } else {
                scenePrompt = `MODEL PLACEMENT TASK:
                Reference Scene: Use the provided reference model image as the base scene.
                Task: Replace the product/object in the reference image (e.g. in the model's hand or on the table) with the analyzed product.
                Placement Instructions: ${settings.modelPlacement.prompt || "Replace the object naturally with the analyzed product."}
                
                Style & Atmosphere:
                - Maintain the lighting, shadows, and color grading of the reference model image perfectly.
                - Apply the following style influence (subtly): ${styleContext}`;
            }

            referenceImageBase64 = settings.modelPlacement.referenceImage;
        } else {
            // Standard Scene Mode
            const presetScene = PRESET_SCENES[settings.preset as keyof typeof PRESET_SCENES] || PRESET_SCENES.minimalist;
            scenePrompt = settings.customPrompt
                ? `${presetScene}. ${settings.customPrompt}`
                : presetScene;

            // Add text overlay instruction if enabled
            if (settings.textOverlay?.enabled && settings.textOverlay.text) {
                scenePrompt += `\n\nIMPORTANT: Add the text "${settings.textOverlay.text}" to the image. 
                Style: ${settings.textOverlay.style}. 
                Position: ${settings.textOverlay.position}. 
                The text must be sharp, clear, and perfectly readable. It should look like a professional commercial banner or overlay.
                CRITICAL: Ensure all characters are rendered correctly, supporting multi-language text including Vietnamese diacritics (e.g., ư, ơ, ê, ô, á, à, ả, ã, ạ). The text should be integrated naturally into the scene but remain legible.`;
            }
        }

        console.log('Generate API: Scene prompt constructed', { scenePrompt: scenePrompt.substring(0, 100) + '...' });

        // Reconstruct the base64 data URL
        const imageDataUrl = `data:image/jpeg;base64,${image}`;

        console.log('Generate API: Calling generateProductScene');
        // Try to generate with Gemini
        const { imageUrl, fullPrompt } = await generateProductScene(
            imageDataUrl,
            analysis,
            scenePrompt,
            settings.model,
            settings.aspectRatio,
            apiKey,
            referenceImageBase64,
            settings.imageSize
        );

        console.log('Generate API: Image generated successfully');

        return NextResponse.json({
            id: crypto.randomUUID(),
            url: imageUrl,
            prompt: fullPrompt,
        });

    } catch (error: any) {
        console.error("Generate API: Error occurred", {
            message: error?.message,
            stack: error?.stack,
            error: error
        });
        return NextResponse.json(
            { error: error?.message || "Failed to generate image. Please try again." },
            { status: 500 }
        );
    }
}
