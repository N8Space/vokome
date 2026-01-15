import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get("audio") as File;

        if (!audioFile) {
            return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
        }

        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "Service configuration error" }, { status: 500 });
        }
        console.log("Using ElevenLabs Key starting with:", apiKey.substring(0, 5) + "...");

        // Prepare FormData for ElevenLabs
        const elevenLabsFormData = new FormData();
        elevenLabsFormData.append("name", "User Clone " + new Date().toLocaleString());
        elevenLabsFormData.append("files", audioFile);
        elevenLabsFormData.append("description", "Cloned from user recording");

        console.log("Cloning Voice with ElevenLabs...");

        const response = await fetch("https://api.elevenlabs.io/v1/voices/add", {
            method: "POST",
            headers: {
                "xi-api-key": apiKey,
                // Note: Do NOT set Content-Type header manually when using FormData, 
                // let fetch set the boundary.
            },
            body: elevenLabsFormData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("ElevenLabs Voice Clone Failed:", errorText);
            throw new Error(`ElevenLabs API error: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log("Voice Cloned Successfully:", data.voice_id);

        return NextResponse.json({ voice_id: data.voice_id });

    } catch (error: any) {
        console.error("Voice Clone Route Error:", error);
        return NextResponse.json({ error: error.message || "Failed to clone voice" }, { status: 500 });
    }
}
