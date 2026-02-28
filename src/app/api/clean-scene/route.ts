import { NextRequest, NextResponse } from "next/server";
import { cleanSceneImage } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";

export const maxDuration = 60; // Set generous max duration

export async function POST(req: NextRequest) {
    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { imageBase64, apiKey } = body;

        if (!imageBase64) {
            return NextResponse.json({ error: "Missing source image" }, { status: 400 });
        }

        const { imageUrl } = await cleanSceneImage(imageBase64, apiKey);

        return NextResponse.json({ imageUrl });

    } catch (error: any) {
        console.error("Clean Scene API Error:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to clean scene" },
            { status: 500 }
        );
    }
}
