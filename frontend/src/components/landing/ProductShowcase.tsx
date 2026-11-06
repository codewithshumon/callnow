"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Phone,
  BarChart3,
  Globe2,
  MessageSquare,
  Code2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users2,
  Voicemail,
  Sliders,
  Send,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const TABS = [
  {
    id: "dialer",
    label: "Power Dialer",
    icon: BarChart3,
    badge: "4x Faster",
    title: "Intelligent Outbound Power Dialer",
    description:
      "Eliminate repetitive manual dialing. Upload your contact CSV, set concurrent dialing streams, and automatically route answered calls to your active browser softphone with zero wait time.",
    highlights: [
      "Smart multi-line pacing with live answer detection (AMD)",
      "Instant 1-click automated voicemail drop",
      "Real-time campaign velocity and disposition tags",
      "Do Not Call (DNC) list auto-scrubbing & compliance",
    ],
    image: "/images/power-dialer-hud.jpg",
    cta: "Launch a Campaign",
    ctaLink: "/dialer/new",
  },
  {
    id: "numbers",
    label: "Virtual Numbers",
    icon: Globe2,
    badge: "50+ Countries",
    title: "Instant Global Telecom Presence",
    description:
      "Acquire local, toll-free, and national numbers in seconds across North America, Europe, Asia, and Australasia. Outbound caller ID matches your target audience to maximize pick-up rates.",
    highlights: [
      "Local presence caller ID in 50+ countries and 1,000+ area codes",
      "SMS & MMS enabled on virtual phone lines",
      "Intelligent call forwarding to WebRTC, SIP, or mobile",
      "Number porting support for existing business lines",
    ],
    image: "/images/global-network.jpg",
    cta: "Browse Numbers",
    ctaLink: "/numbers",
  },
  {
    id: "softphone",
    label: "WebRTC Softphone",
    icon: Phone,
    badge: "Zero Hardware",
    title: "Carrier-Grade WebRTC In-Browser Calling",
    description:
      "Turn any modern browser into an enterprise telephone. Built on low-latency WebRTC with automatic echo cancellation, adaptive jitter buffering, and Opus HD voice encoding.",
    highlights: [
      "Native browser audio with zero software or plugins required",
      "Dual-tone multi-frequency (DTMF) keypad for IVR navigation",
      "Live call recording with instant MP3/WAV playback",
      "Integrated contact directory and 1-click click-to-call",
    ],
    image: "/images/hero-telephony.jpg",
    cta: "Open Softphone",
    ctaLink: "/calls/dialpad",
  },
  {
    id: "sms",
    label: "SMS & MMS",
    icon: MessageSquare,
    badge: "Real-time",
    title: "Two-Way Business Messaging",
    description:
      "Send and receive text messages and photo attachments from your business numbers. Keep prospects engaged with fast canned responses, conversation threads, and delivery tracking.",
    highlights: [
      "Two-way SMS and MMS with real-time WebSocket delivery receipts",
      "Reusable message templates with custom merge tags",
      "Threaded inbox with contact context and history",
      "10DLC and A2P compliance registered routing",
    ],
    image: "/images/power-dialer-hud.jpg",
    cta: "Start Messaging",
    ctaLink: "/messages",
  },
];

export default function ProductShowcase() {
  const [activeTab, setActiveTab] = useState("dialer");

  return (
    <div className="space-y-8">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-xs font-semibold px-3 py-1">
          Complete Telephony Suite
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Everything You Need to Power Global Voice & SMS
        </h2>
        <p className="text-muted-foreground text-base sm:text-lg">
          Explore the modular capabilities built into VoiceLink — engineered for speed, reliability, and scale.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-center">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto p-1.5 rounded-2xl bg-muted/60 border border-border/80 gap-1 w-full max-w-2xl">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="rounded-xl py-2.5 px-3 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
                >
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {TABS.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-8 focus-visible:outline-none">
            <div className="rounded-3xl border border-border/80 bg-gradient-to-b from-card to-card/60 p-6 sm:p-8 lg:p-10 shadow-xl overflow-hidden backdrop-blur">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Left: Content & Bullet checklist */}
                <div className="lg:col-span-6 space-y-6">
                  <div className="space-y-2">
                    <Badge variant="secondary" className="text-xs font-mono font-medium">
                      {tab.badge}
                    </Badge>
                    <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                      {tab.title}
                    </h3>
                    <p className="text-muted-foreground text-base leading-relaxed">
                      {tab.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {tab.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-sm font-medium text-foreground/90">
                          {h}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center gap-4">
                    <Link
                      href={tab.ctaLink}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90"
                    >
                      <span>{tab.cta}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/register"
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-background/50 px-5 py-3 text-sm font-medium text-foreground hover:bg-muted transition"
                    >
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <span>Start Free Trial</span>
                    </Link>
                  </div>
                </div>

                {/* Right: Graphic Artwork Preview */}
                <div className="lg:col-span-6">
                  <div className="relative rounded-2xl overflow-hidden border border-border/80 shadow-2xl bg-black/40 group">
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent z-10 pointer-events-none" />
                    <img
                      src={tab.image}
                      alt={tab.title}
                      className="w-full h-[320px] sm:h-[400px] object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between text-xs text-white/90 bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10">
                      <span className="font-mono flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                        VoiceLink Live Engine
                      </span>
                      <span className="text-white/60 font-mono">99.99% Carrier SLA</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
