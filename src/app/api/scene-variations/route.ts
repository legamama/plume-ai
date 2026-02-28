import { NextRequest, NextResponse } from "next/server";
import { generateSceneVariations } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";

export const maxDuration = 60; // Set generous max duration

export async function POST(req: NextRequest) {
    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { imageBase64, count, apiKey } = body;

        if (!imageBase64) {
            return NextResponse.json({ error: "Missing source image" }, { status: 400 });
        }

        const variationCount = count || 2;
        const { imageUrls } = await generateSceneVariations(imageBase64, variationCount, apiKey);

        return NextResponse.json({ imageUrls });

    } catch (error: any) {
        console.error("Scene Variations API Error:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to generate variations" },
            { status: 500 }
        );
    }
}
