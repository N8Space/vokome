"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Play, CheckCircle2, FileText, Mic, Video, Square, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { PlayerComponent } from "@/components/remotion/PlayerComponent";

export default function CreatePage() {
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [step, setStep] = useState(0);
    const [progress, setProgress] = useState(0);

    // Voice Cloning State
    const [isRecording, setIsRecording] = useState(false);
    const [timer, setTimer] = useState(0);
    const [voiceId, setVoiceId] = useState<string | null>(null);
    const [cloningStatus, setCloningStatus] = useState<"idle" | "recording" | "uploading" | "done" | "error">("idle");
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                // Enforce minimum duration (e.g. 30s) for quality? 
                // Creating a warning rather than a block for now.
                if (timer < 30) {
                    if (!confirm("Your recording is quite short (< 30s). Quality might be low. Clone anyway?")) {
                        return;
                    }
                }
                await handleVoiceUpload(blob);
                stream.getTracks().forEach(track => track.stop()); // Stop mic
            };

            mediaRecorder.start();
            setIsRecording(true);
            setCloningStatus("recording");
            setTimer(0);
            timerRef.current = setInterval(() => {
                setTimer(t => t + 1);
            }, 1000);

        } catch (e) {
            console.error("Mic Access Error:", e);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setCloningStatus("uploading");
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    // ... handleVoiceUpload ...

    // Reading Script
    const readingScript = "When the sunlight strikes raindrops in the air, they act as a prism and form a rainbow. The rainbow is a division of white light into many beautiful colors. These take the shape of a long round arch, with its path high above, and its two ends apparently beyond the horizon. There is, according to legend, a boiling pot of gold at one end. People look, but no one ever finds it. When a man looks for something beyond his reach, his friends say he is looking for the pot of gold at the end of the rainbow.";

    const handleVoiceUpload = async (audioBlob: Blob) => {
        try {
            const { ApiService } = await import("@/lib/api-service");
            const newVoiceId = await ApiService.cloneVoice(audioBlob);

            if (newVoiceId) {
                setVoiceId(newVoiceId);
                setCloningStatus("done");
            } else {
                setCloningStatus("error");
            }
        } catch (e) {
            console.error("Voice Clone Error:", e);
            setCloningStatus("error");
        }
    };

    const handleGenerate = async () => {
        setLoading(true);
        setStep(1);

        try {
            const { ApiService } = await import("@/lib/api-service");
            // Pass content, image, and OPTIONAL voiceId
            const url = await ApiService.generateFullVideo(content, selectedImage, voiceId, (status) => {
                setProgress(status.progress);
                if (status.step === 'error') {
                    setLoading(false);
                    alert("Error: " + status.error);
                }
            });

            if (url) {
                setVideoUrl(url);
                setLoading(false);
                setStep(2);
            }
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center p-4 bg-background">
            <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] opacity-50"></div>

            <div className="w-full max-w-4xl space-y-8 mt-10">
                <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                    Create New Video
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>Content Input</CardTitle>
                                <CardDescription>Paste the text of the article or topic you want to explain.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Step 1: Avatar Image */}
                                <div className="space-y-2">
                                    <Label htmlFor="image">1. Your Selfie (Avatar)</Label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100">
                                            {selectedImage ? (
                                                <img src={selectedImage} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <Video className="w-6 h-6" />
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            id="image"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                                        />
                                    </div>
                                </div>

                                {/* Step 2: Voice Cloning */}
                                <div className="space-y-2">
                                    <Label className="text-blue-100">2. Your Voice (Optional)</Label>
                                    <div className="p-4 border border-white/10 rounded-lg bg-black/20 flex flex-col gap-4">
                                        {cloningStatus === "done" ? (
                                            <div className="flex items-center text-green-400 gap-2 neon-text">
                                                <CheckCircle2 className="w-5 h-5" />
                                                <div>
                                                    <p className="text-sm font-bold">Voice Cloned Successfully!</p>
                                                    <p className="text-xs text-green-300/70">ID: {voiceId?.slice(0, 10)}...</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Option A: File Upload */}
                                                <div className="space-y-2 pb-4 border-b border-white/10">
                                                    <Label className="text-xs text-blue-300/70 uppercase tracking-wider font-semibold">Option A: Upload Audio File</Label>
                                                    <input
                                                        type="file"
                                                        accept="audio/*"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                setCloningStatus("uploading");
                                                                await handleVoiceUpload(file);
                                                            }
                                                        }}
                                                        className="block w-full text-sm text-blue-200
                                                        file:mr-4 file:py-2 file:px-4
                                                        file:rounded-full file:border-0
                                                        file:text-xs file:font-semibold
                                                        file:bg-purple-900/40 file:text-purple-300
                                                        hover:file:bg-purple-800/50 cursor-pointer"
                                                    />
                                                </div>

                                                {/* Option B: Record */}
                                                <div className="space-y-2 pt-2">
                                                    <Label className="text-xs text-blue-300/70 uppercase tracking-wider font-semibold">Option B: Record Microphone</Label>
                                                    <div className="bg-black/30 p-3 rounded border border-white/10 text-sm text-blue-100/80 leading-relaxed italic">
                                                        <p className="font-semibold text-cyan-400 mb-1 not-italic">Please read this script (~60s):</p>
                                                        "{readingScript}"
                                                    </div>

                                                    <div className="flex flex-col gap-2">
                                                        {isRecording && (
                                                            <div className={`text-center font-mono font-bold text-xl ${timer < 30 ? 'text-orange-500' : 'text-green-600'}`}>
                                                                {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                                                                <span className="text-xs font-sans font-normal text-gray-400 block">
                                                                    {timer < 60 ? "(Keep going, aim for 1 min)" : "(Great length!)"}
                                                                </span>
                                                            </div>
                                                        )}

                                                        <Button
                                                            variant={isRecording ? "destructive" : "secondary"}
                                                            size="sm"
                                                            onClick={isRecording ? stopRecording : startRecording}
                                                            className="w-full"
                                                            disabled={cloningStatus === "uploading"}
                                                        >
                                                            {isRecording ? (
                                                                <> <Square className="w-4 h-4 mr-2" /> Stop Recording </>
                                                            ) : (
                                                                <> <Mic className="w-4 h-4 mr-2" /> {cloningStatus === "uploading" ? "Cloning..." : "Start Recording"} </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Step 3: Text Content */}
                                <div className="space-y-2">
                                    <Label htmlFor="content">3. Knowledge Article / Text</Label>
                                    <Textarea
                                        id="content"
                                        placeholder="Paste article content here (max 500 words)..."
                                        className="min-h-[150px]"
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                    />
                                </div>

                                <Button
                                    onClick={handleGenerate}
                                    disabled={loading || step === 2 || !content}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                                        </>
                                    ) : (
                                        <> <Sparkles className="mr-2 h-4 w-4" /> Generate Video </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {step >= 1 && (
                            <Card className="bg-muted/50">
                                <CardContent className="pt-6 space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Generating Video...</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <Progress value={progress} className="w-full h-2" />

                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            {progress > 10 ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Loader2 className="h-4 w-4 animate-spin" />}
                                            Summarizing text with Gemini...
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {progress > 40 ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : (progress > 30 && <Loader2 className="h-4 w-4 animate-spin" />)}
                                            Generating Voice ({voiceId ? "Cloned" : "Default"})...
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {progress > 70 ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : (progress > 60 && <Loader2 className="h-4 w-4 animate-spin" />)}
                                            Animating Avatar...
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="relative">
                        {/* Preview Area */}
                        {step === 2 && videoUrl ? (
                            <Card className="overflow-hidden shadow-2xl border-0 h-full">
                                <CardContent className="p-0 h-full">
                                    <PlayerComponent videoUrl={videoUrl} captions={content.substring(0, 50) + "..."} />
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="h-full min-h-[400px] border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                                <div className="p-4 rounded-full bg-gray-50 mb-4">
                                    <Play className="w-8 h-8 opacity-50" />
                                </div>
                                <p className="font-medium">Video Preview</p>
                                <p className="text-sm mt-2">Your content will appear here once generated.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
