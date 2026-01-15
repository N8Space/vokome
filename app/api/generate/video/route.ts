import { NextRequest, NextResponse } from "next/server";

// Helper to upload Base64 assets to Google Drive via n8n
async function uploadToN8n(base64Data: string, filename: string, mimeType: string) {
    const n8nUrl = "https://n8n.srv1133159.hstgr.cloud/webhook/75bdb611-5f13-4c09-a2b9-42185744bdd0"; // User's Webhook

    // Strip prefix if present (e.g., data:image/png;base64,)
    const cleanBase64 = base64Data.replace(/^data:[\w\/]+;base64,/, "");

    try {
        const response = await fetch(n8nUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename, mimeType, data: cleanBase64 })
        });

        if (!response.ok) {
            console.error(`n8n Upload Failed for ${filename}:`, response.statusText);
            return null;
        }

        const result = await response.json();
        return result.webContentLink; // The Public Drive URL
    } catch (e) {
        console.error(`n8n Error for ${filename}:`, e);
        return null;
    }
}

// ------------------------------------------------------------------
// HeyGen Helper: Upload Audio Asset
// ------------------------------------------------------------------
async function uploadHeyGenAudioAsset(audioUrl: string, apiKey: string) {
    try {
        console.log("Downloading audio from Drive...", audioUrl);
        const res = await fetch(audioUrl);
        if (!res.ok) throw new Error("Failed to download audio from Drive");

        const contentType = res.headers.get("content-type") || "audio/mpeg";
        const buffer = await res.arrayBuffer();

        console.log(`Uploading Audio to HeyGen Asset API (${contentType}, ${buffer.byteLength} bytes)...`);

        const response = await fetch("https://upload.heygen.com/v1/asset", {
            method: "POST",
            headers: {
                "X-Api-Key": apiKey,
                "Content-Type": contentType
            },
            body: Buffer.from(buffer)
        });

        if (!response.ok) {
            const raw = await response.text();
            console.error("HeyGen Audio Upload Failed:", raw);
            return null;
        }

        const data = await response.json();
        console.log("HeyGen Audio Asset Response:", data);
        return data.data.id;

    } catch (e) {
        console.error("HeyGen Audio Asset Upload Error:", e);
        return null;
    }
}

// ------------------------------------------------------------------
// HeyGen Helper: Upload Talking Photo
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// HeyGen Helper: Upload Talking Photo
// ------------------------------------------------------------------
async function uploadHeyGenTalkingPhoto(imageUrl: string, apiKey: string) {
    try {
        console.log("Downloading image from Drive...", imageUrl);
        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) throw new Error("Failed to download image from Drive");

        const contentType = imgRes.headers.get("content-type") || "image/png";
        const buffer = await imgRes.arrayBuffer();

        console.log(`Uploading to HeyGen Talking Photo API (${contentType}, ${buffer.byteLength} bytes)...`);

        const response = await fetch("https://upload.heygen.com/v1/talking_photo", {
            method: "POST",
            headers: {
                "X-Api-Key": apiKey,
                "Content-Type": contentType
            },
            body: Buffer.from(buffer)
        });

        if (!response.ok) {
            const raw = await response.text();
            console.error("HeyGen Photo Upload Failed:", raw);
            // Try to parse JSON error message if possible
            try {
                const jsonErr = JSON.parse(raw);
                throw new Error(jsonErr.message || raw);
            } catch (e) {
                // If not JSON or parse fails, throw raw text
                throw new Error(raw);
            }
        }

        const data = await response.json();
        console.log("HeyGen Photo Asset Response:", data);
        return data.data.talking_photo_id;

    } catch (e: any) {
        console.error("HeyGen Photo Asset Upload Error:", e);
        // Re-throw so the main handler catches it
        throw e;
    }
}

// ------------------------------------------------------------------
// Main Handler
// ------------------------------------------------------------------
export async function POST(req: NextRequest) {
    try {
        const { audioUrl: audioBase64, imageUrl: imageBase64OrUrl } = await req.json();

        if (!audioBase64) {
            return NextResponse.json({ error: "Audio Data is required" }, { status: 400 });
        }

        console.log("Starting Asset Uploads...");

        // 1. Upload Audio to Drive (Primary Storage)
        const publicAudioUrl = await uploadToN8n(audioBase64, `audio-${Date.now()}.mp3`, "audio/mpeg");
        if (!publicAudioUrl) {
            return NextResponse.json({ error: "Failed to upload audio to storage" }, { status: 500 });
        }
        console.log("Audio Hosted:", publicAudioUrl);

        // 2. Upload Image to Drive (Primary Storage)
        let publicImageUrl = imageBase64OrUrl;
        if (publicImageUrl && publicImageUrl.startsWith("data:")) {
            publicImageUrl = await uploadToN8n(publicImageUrl, `avatar-${Date.now()}.png`, "image/png");
            console.log("Avatar Image Hosted:", publicImageUrl);
        }

        // 3. Generate Video (HeyGen)
        const heyGenApiKey = process.env.HEYGEN_API_KEY;

        if (heyGenApiKey && publicImageUrl) {
            console.log("Preparing assets for HeyGen...");

            // A. Register Photo
            const talkingPhotoId = await uploadHeyGenTalkingPhoto(publicImageUrl, heyGenApiKey);
            // if (!talkingPhotoId) throw new Error("Failed to register photo with HeyGen"); // Handled by function throw
            console.log("HeyGen Photo ID:", talkingPhotoId);

            // B. Register Audio (Avoids Drive URL blocking issues)
            const audioAssetId = await uploadHeyGenAudioAsset(publicAudioUrl, heyGenApiKey);
            if (!audioAssetId) throw new Error("Failed to register audio with HeyGen");
            console.log("HeyGen Audio Asset ID:", audioAssetId);

            console.log("Calling HeyGen API (Generate)...");

            const heyGenRes = await fetch("https://api.heygen.com/v2/video/generate", {
                method: "POST",
                headers: {
                    "X-Api-Key": heyGenApiKey,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    video_inputs: [
                        {
                            character: {
                                type: "talking_photo",
                                talking_photo_id: talkingPhotoId
                            },
                            voice: {
                                type: "audio",
                                audio_asset_id: audioAssetId, // Use Asset ID, not URL!
                                // audio_url: publicAudioUrl 
                            },
                            background: {
                                type: "color",
                                value: "#000000"
                            }
                        }
                    ],
                    dimension: { width: 1280, height: 720 }
                })
            });

            if (!heyGenRes.ok) {
                const err = await heyGenRes.json();
                console.error("HeyGen Failed:", err);
                throw new Error("HeyGen API Refused: " + JSON.stringify(err));
            }

            const heyGenData = await heyGenRes.json();
            const video_id = heyGenData.data?.video_id;

            return NextResponse.json({
                id: video_id,
                status: "processing",
                message: "Video generation started"
            });

        } else {
            // Fallback: Audio Only
            console.log("HeyGen skipped (No Key or No Image). Returning Audio.");
            return NextResponse.json({
                id: "audio_only_" + Date.now(),
                status: "completed",
                video_url: publicAudioUrl
            });
        }

    } catch (error: any) {
        console.error("Video Generation Error:", error);
        return NextResponse.json({ error: error.message || "Failed to start video generation" }, { status: 500 });
    }
}
