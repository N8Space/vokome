export interface VideoGenerationStatus {
    step: 'summarizing' | 'audio' | 'video' | 'complete';
    progress: number;
}

export const MockService = {
    async summarizeText(text: string): Promise<string> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve("This is a 30s summary of the provided text. Artificial Intelligence is transforming industries by automating tasks and generating creative content.");
            }, 2000);
        });
    },

    async generateAudio(text: string): Promise<string> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve("mock-audio-url.mp3");
            }, 3000);
        });
    },

    async generateVideo(audioUrl: string, imageUrl: string): Promise<string> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve("mock-video-url.mp4");
            }, 5000);
        });
    },

    // Helper to simulate the full flow with progress callback
    async generateFullVideo(
        text: string,
        onProgress: (status: VideoGenerationStatus) => void
    ): Promise<string> {
        // Step 1: Summary
        onProgress({ step: 'summarizing', progress: 10 });
        await this.summarizeText(text);
        onProgress({ step: 'summarizing', progress: 30 });

        // Step 2: Audio
        onProgress({ step: 'audio', progress: 40 });
        await this.generateAudio("summary");
        onProgress({ step: 'audio', progress: 70 });

        // Step 3: Video
        onProgress({ step: 'video', progress: 80 });
        const videoUrl = await this.generateVideo("audio", "image");

        // Complete
        onProgress({ step: 'complete', progress: 100 });
        return videoUrl;
    }
};
