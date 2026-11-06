import type { ReactNode } from "react";
import Link from "next/link";
import { Phone, ArrowLeft, ShieldCheck, Zap, Globe2, Sparkles, CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-background text-foreground lg:grid lg:grid-cols-12">
      {/* Left Column: Visual Showcase Artwork & Brand Story (Desktop only) */}
      <div className="relative hidden lg:col-span-5 xl:col-span-6 lg:flex flex-col justify-between p-10 xl:p-14 overflow-hidden bg-black text-white selection:bg-primary/30">
        {/* Background Image with subtle cinematic gradients */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-telephony.jpg"
            alt="VoiceLink Telephony Network"
            className="h-full w-full object-cover object-center opacity-40 mix-blend-luminosity scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Top: Brand Header */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-white group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30 transition-transform group-hover:scale-105">
              <Phone className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span>VoiceLink</span>
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-primary-foreground/90 bg-white/10 px-1.5 py-0.5 rounded border border-white/15">
                Cloud
              </span>
            </div>
          </Link>

          <Badge variant="outline" className="border-white/20 bg-white/10 text-white/90 text-xs backdrop-blur font-mono">
            Public Beta
          </Badge>
        </div>

        {/* Middle: Value Prop & Testimonial Card */}
        <div className="relative z-10 space-y-6 max-w-lg my-auto py-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary border border-primary/30">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Next-Gen Cloud Softphone</span>
            </div>
            <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              One browser tab. Global telephone network.
            </h2>
            <p className="text-white/70 text-sm xl:text-base leading-relaxed">
              Make high-definition WebRTC voice calls, automate outbound campaigns with 10x concurrency, and claim virtual numbers in 50+ countries.
            </p>
          </div>

          {/* Glass Testimonial snippet */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md space-y-3 shadow-xl">
            <p className="text-xs xl:text-sm italic text-white/90 leading-relaxed">
              &ldquo;VoiceLink replaced our physical desk phones and saved us $3,400/month. The browser audio clarity is unbelievable.&rdquo;
            </p>
            <div className="flex items-center gap-3 pt-1">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&auto=format&fit=crop&q=80"
                alt="Elena Rostova"
                className="h-8 w-8 rounded-full object-cover ring-1 ring-white/20"
              />
              <div>
                <p className="text-xs font-bold text-white">Elena Rostova</p>
                <p className="text-[11px] text-white/60">Head of Operations, Apex Logistics</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Telecom Features checklist */}
        <div className="relative z-10 grid grid-cols-2 gap-3 pt-4 border-t border-white/10 text-xs text-white/80">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Opus 48kHz HD Audio</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>50+ Countries Covered</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>SOC2 Type II Aligned</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>99.99% Carrier SLA</span>
          </div>
        </div>
      </div>

      {/* Right Column: Auth Form Container */}
      <div className="lg:col-span-7 xl:col-span-6 flex flex-col justify-between min-h-screen px-4 sm:px-8 py-6 sm:py-10">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between w-full max-w-lg mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to VoiceLink</span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile-only brand logo */}
        <div className="lg:hidden flex items-center justify-center gap-2 font-bold text-lg text-foreground my-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Phone className="h-4 w-4" />
          </div>
          <span>VoiceLink Cloud</span>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-md mx-auto my-auto py-6 sm:py-8">
          {children}
        </div>

        {/* Footer legal & security */}
        <div className="w-full max-w-md mx-auto text-center text-xs text-muted-foreground pt-4 border-t border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>256-Bit TLS Encryption</span>
          </div>
          <span className="text-[11px]">&copy; {new Date().getFullYear()} VoiceLink Cloud</span>
        </div>
      </div>
    </div>
  );
}
