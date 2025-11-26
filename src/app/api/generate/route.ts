import { NextResponse } from "next/server";
import { generateProductScene } from "@/lib/gemini";

// Preset scene descriptions
const PRESET_SCENES = {
    minimalist: "Clean white studio background with professional high-key lighting, soft shadows, minimal props",
    luxury: "Elegant marble surface with dramatic lighting, premium textures like marble or velvet, elegant composition",
    nature: "Natural stone podium surrounded by greenery, organic elements like leaves, soft sunlight filtering through trees",
    neon: "Futuristic cyberpunk vibe with neon blue and pink lights, dark background, vibrant glow effects",
    cozy: "Warm, inviting wooden table setting with natural window light, cozy home interior atmosphere",
    floating: "Surreal floating composition with pastel colors (pink, lavender, mint), dreamy ethereal background"
};

export async function POST(req: Request) {
    try {
        const { image, analysis, settings } = await req.json();

        if (!image || !analysis || !settings) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Construct the scene prompt
        const presetScene = PRESET_SCENES[settings.preset as keyof typeof PRESET_SCENES] || PRESET_SCENES.minimalist;
        const scenePrompt = settings.customPrompt
            ? `${presetScene}. ${settings.customPrompt}`
            : presetScene;

        // Reconstruct the base64 data URL
        const imageDataUrl = `data:image/jpeg;base64,${image}`;

        // Try to generate with Gemini
        const generatedImageUrl = await generateProductScene(
            imageDataUrl,
            analysis,
            scenePrompt,
            settings.model,
            settings.aspectRatio
        );

        const fullPrompt = `Product: ${analysis}\nScene: ${scenePrompt}\nAspect Ratio: ${settings.aspectRatio}`;

        return NextResponse.json({
            id: crypto.randomUUID(),
            url: generatedImageUrl,
            prompt: fullPrompt,
        });

    } catch (error: any) {
        console.error("Generation error:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to generate image. Please try again." },
            { status: 500 }
        );
    }
}
