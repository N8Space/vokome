export interface VideoGenerationStatus {
    step: 'summarizing' | 'audio' | 'video' | 'complete' | 'error';
    progress: number;
    data?: any;
    error?: string;
}

export const ApiService = {
    async cloneVoice(audioBlob: Blob): Promise<string | null> {
        try {
            const formData = new FormData();
            formData.append("audio", audioBlob, "recording.webm");

            const res = await fetch("/api/clone-voice", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: res.statusText }));
                throw new Error(err.error || "Voice cloning failed");
            }

            const data = await res.json();
            return data.voice_id;
        } catch (e) {
            console.error("Voice Clone Service Error:", e);
            return null;
        }
    },

    async generateFullVideo(
        text: string,
        userImageUrl: string | null,
        voiceId: string | null, // New Parameter
        onProgress: (status: VideoGenerationStatus) => void
    ): Promise<string | null> {
        try {
            // Step 1: Summary (Gemini)
            onProgress({ step: 'summarizing', progress: 10 });
            const summaryRes = await fetch('/api/generate/summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            if (!summaryRes.ok) {
                const err = await summaryRes.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(err.error || `Summary API failed: ${summaryRes.statusText}`);
            }
            const { summary } = await summaryRes.json();
            console.log("Summary:", summary);
            onProgress({ step: 'summarizing', progress: 30 });

            // Step 2: Audio (ElevenLabs)
            onProgress({ step: 'audio', progress: 40 });
            const audioRes = await fetch('/api/generate/audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: summary, voiceId: voiceId || undefined })
            });
            if (!audioRes.ok) {
                const err = await audioRes.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(err.error || `Audio API failed: ${audioRes.statusText}`);
            }
            const { audioUrl } = await audioRes.json();
            console.log("Audio Generated");
            onProgress({ step: 'audio', progress: 70 });

            // Step 3: Video (HeyGen)
            onProgress({ step: 'video', progress: 80 });
            // For MVP, we play the audio immediately in the UI if video generation is skipped/mocked 
            // or we pass it to the video generator.
            // Since our Video Route is hybrid/mock, we'll call it to get the "video_id".

            const videoRes = await fetch('/api/generate/video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    audioUrl,
                    imageUrl: userImageUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=800&auto=format&fit=crop&q=60"
                })
            });

            if (!videoRes.ok) {
                const err = await videoRes.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(err.error || `Video API failed: ${videoRes.statusText}`);
            }

            // Fix: Parse the new flat response structure
            const videoData = await videoRes.json(); // { id, status, video_url }
            console.log("Video API Response:", videoData);

            // If it's already completed (Mock or n8n immediate link), return early
            if (videoData.status === 'completed' && videoData.video_url) {
                console.log("Immediate Success! URL:", videoData.video_url);

                // Note: We cannot HEAD fetch google drive links from client due to CORS, 
                // but the direct link should work in the Audio tag if public.

                // Ensure we pass the data in a consistent structure
                // The interface says 'data?: any', but components might expect { video_url }
                onProgress({ step: 'complete', progress: 100, data: videoData });
                return videoData.video_url;
            }

            const video_id = videoData.id;
            console.log("Polling for video:", video_id);

            // Poll for completion (Only if not already done)
            let attempts = 0;
            const maxAttempts = 150; // 5 minutes (150 * 2000ms)

            return new Promise((resolve, reject) => {
                const pollInterval = setInterval(async () => {
                    attempts++;
                    try {
                        const statusRes = await fetch('/api/generate/video/status', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ video_id })
                        });

                        if (statusRes.ok) {
                            const statusData = await statusRes.json();
                            // Handle both structures just in case (nested data or flat)
                            const status = statusData.data?.status || statusData.status;
                            const url = statusData.data?.video_url || statusData.video_url;

                            if (status === 'completed') {
                                clearInterval(pollInterval);
                                onProgress({ step: 'complete', progress: 100, data: statusData });
                                resolve(url);
                            } else if (status === 'failed' || status === 'error') {
                                clearInterval(pollInterval);
                                const errorReason = statusData.data?.error || statusData.error || 'Video generation failed at provider';
                                throw new Error(typeof errorReason === 'string' ? errorReason : JSON.stringify(errorReason));
                            }
                        }
                    } catch (e) {
                        console.error("Polling error", e);
                    }

                    if (attempts >= maxAttempts) {
                        clearInterval(pollInterval);
                        reject(new Error("Video generation timed out"));
                    }
                }, 2000);
            });

        } catch (e: any) {
            console.error(e);
            onProgress({ step: 'error', progress: 0, error: e.message });
            return null;
        }
    }
};
