import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Video, Mic, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground animate-in fade-in zoom-in duration-700 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse delay-1000"></div>

      <main className="flex flex-col items-center gap-10 px-4 text-center max-w-5xl z-10">

        {/* Hero Header */}
        <div className="space-y-6 flex flex-col items-center relative z-20">
          <div className="px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium neon-border mb-4">
            ✨ Vokome: AI-Powered Video / Audio Generator
          </div>

          <h1 className="text-6xl font-black tracking-tighter sm:text-8xl bg-gradient-to-br from-white via-cyan-200 to-purple-400 bg-clip-text text-transparent neon-text leading-[1.1] py-4 px-2 relative z-30">
            Ignite Your <br /> Knowledge
          </h1>

          <p className="text-xl text-blue-100/70 sm:text-2xl max-w-[700px] mx-auto leading-relaxed">
            Create stunning <span className="text-cyan-400 font-bold">30-second AI videos</span> from any text.
            Clone your voice. Animate your selfie. <br />Instant dopamine for you.
          </p>

          <div className="mt-8 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-full blur opacity-40 group-hover:opacity-100 transition duration-500"></div>
            <Link href="/create">
              <Button size="lg" className="relative h-16 px-12 rounded-full text-xl font-bold bg-background border border-white/20 hover:bg-white/10 text-white shadow-2xl transition-all">
                <Sparkles className="w-6 h-6 mr-2 text-cyan-400 fill-cyan-400" />
                Start Creating Now
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Grid (Glass Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8">
          <div className="glass-card p-6 rounded-2xl flex flex-col items-center gap-3 hover:-translate-y-2 transition-transform duration-300">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-2 neon-border">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Talking Avatars</h3>
            <p className="text-sm text-blue-200/60">Upload a selfie and watch it come alive with HeyGen AI technology.</p>
          </div>

          <div className="glass-card p-6 rounded-2xl flex flex-col items-center gap-3 hover:-translate-y-2 transition-transform duration-300 delay-100">
            <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-secondary mb-2 neon-border">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Voice Cloning</h3>
            <p className="text-sm text-blue-200/60">Record 60s of audio and clone your voice instantly with ElevenLabs.</p>
          </div>

          <div className="glass-card p-6 rounded-2xl flex flex-col items-center gap-3 hover:-translate-y-2 transition-transform duration-300 delay-200">
            <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 mb-2 neon-border">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Instant Summary</h3>
            <p className="text-sm text-blue-200/60">Gemini AI condenses dense articles into punchy, verified scripts.</p>
          </div>
        </div>

        {/* CTA */}


        <div className="text-xs text-blue-200/30 mt-12 font-mono uppercase tracking-widest">
          Powered by Gemini • ElevenLabs • HeyGen
        </div>
      </main>
    </div>
  );
}
