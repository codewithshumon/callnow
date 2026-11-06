"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Phone,
  PhoneCall,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Globe2,
  BarChart3,
  MessageSquare,
  Voicemail,
  FileAudio,
  Radio,
  Zap,
  Star,
  Users2,
  Layers,
  ChevronRight,
  Headphones,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import InteractiveDialerDemo from "@/components/landing/InteractiveDialerDemo";
import ProductShowcase from "@/components/landing/ProductShowcase";
import PricingSection from "@/components/landing/PricingSection";
import ComparisonTable from "@/components/landing/ComparisonTable";
import FaqSection from "@/components/landing/FaqSection";
import { cn } from "@/lib/utils";

const LOGO_COMPANIES = [
  "Acme Cloud",
  "HyperScale Labs",
  "Meridian Capital",
  "Nexus Global",
  "Veloce Tech",
  "Altair Health",
];

const TESTIMONIALS = [
  {
    quote:
      "VoiceLink replaced our entire $4,500/month PBX infrastructure. Our remote sales reps in London and New York make hundreds of calls daily right from their browsers with zero lag.",
    author: "Sarah Johnson",
    role: "VP of Sales, CloudScale",
    metric: "+320% connection rate",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
  },
  {
    quote:
      "The power dialer alone saved our business over 18 hours per week in manual dialing. The local presence caller ID feature boosted our prospect pick-up rate instantly.",
    author: "Marcus Chen",
    role: "Founder, GrowthEngine Digital",
    metric: "4.2x more calls per day",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
  },
  {
    quote:
      "Setting up virtual numbers in Australia and the UK took us literally 60 seconds. Our clients think we have a physical office in Sydney when we're actually in Austin.",
    author: "Elena Rostova",
    role: "Head of Operations, Apex Logistics",
    metric: "Saved $3,400/mo on roaming",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* =========================================================================
          Sticky Glassmorphic Header
          Uses .landing-container for exact user-configured max width (1660px)
         ========================================================================= */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
        <div className="landing-container flex h-16 sm:h-20 items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-12">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg sm:text-xl tracking-tight text-foreground group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25 transition-transform group-hover:scale-105">
              <Phone className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span>VoiceLink</span>
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                Cloud
              </span>
            </div>
          </Link>

          {/* Navigation Links (desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#dialer" className="hover:text-foreground transition-colors">
              Power Dialer
            </a>
            <a href="#comparison" className="hover:text-foreground transition-colors">
              Compare
            </a>
            <a href="#pricing" className="hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
          </nav>

          {/* Action CTAs & Theme Toggle */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-98"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4 hidden sm:inline-block" />
            </Link>
          </div>
        </div>
      </header>

      {/* =========================================================================
          Hero Section with Live Interactive Softphone HUD
         ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 lg:pt-20 lg:pb-32">
        {/* Ambient background glows */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-tr from-primary/15 via-cyan-500/10 to-indigo-500/10 blur-3xl opacity-80" />

        <div className="landing-container px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Value Proposition & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Announcement pill */}
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                <span>Next-Gen WebRTC Telephony • Now in Public Beta</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                Global Calls, SMS &amp; Power Dialing.{" "}
                <span className="bg-gradient-to-r from-primary via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  Right In Your Browser.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="max-w-2xl mx-auto lg:mx-0 text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed">
                Ditch expensive PBX hardware, bulky desk phones, and rigid SIM contracts. Provision virtual numbers in 50+ countries, automate outbound campaigns 4x faster, and make crystal-clear calls from any laptop.
              </p>

              {/* CTA Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-7 py-4 text-base font-semibold text-primary-foreground shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all active:scale-98"
                >
                  <span>Start Calling Free</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>

                <Link
                  href="/calls/dialpad"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-border/90 bg-card/70 px-6 py-4 text-base font-semibold text-foreground hover:bg-muted shadow-sm transition-all"
                >
                  <PhoneCall className="h-5 w-5 text-primary" />
                  <span>Open Web Softphone</span>
                </Link>
              </div>

              {/* Value trust badges */}
              <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>99.99% Carrier SLA</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>50+ Countries</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Opus HD Audio</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>No SIM Required</span>
                </div>
              </div>

              {/* User Metric proof */}
              <div className="pt-2 flex items-center justify-center lg:justify-start gap-4 text-xs text-muted-foreground">
                <div className="flex -space-x-2">
                  <img
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-background object-cover"
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                    alt="User"
                  />
                  <img
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-background object-cover"
                    src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&auto=format&fit=crop&q=80"
                    alt="User"
                  />
                  <img
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-background object-cover"
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&auto=format&fit=crop&q=80"
                    alt="User"
                  />
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary ring-2 ring-background text-[10px] font-bold">
                    +10k
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-500" />
                    ))}
                  </div>
                  <span className="font-semibold text-foreground">4.9/5 rating</span> from global sales &amp; support teams
                </div>
              </div>
            </div>

            {/* Right Column: Live Interactive Softphone Demo */}
            <div className="lg:col-span-5">
              <InteractiveDialerDemo />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          Social Proof Logos Strip
         ========================================================================= */}
      <section className="border-y border-border/60 bg-muted/20 py-8">
        <div className="landing-container px-4 sm:px-6 lg:px-8 xl:px-12">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
            Trusted by fast-growing remote teams, sales agencies, and global enterprises
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-70 grayscale hover:grayscale-0 transition-all">
            {LOGO_COMPANIES.map((company, idx) => (
              <span key={idx} className="font-mono text-sm sm:text-base font-bold tracking-tight text-foreground/80">
                {company}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          Interactive Product Showcase (Tabs + AI Artworks)
         ========================================================================= */}
      <section id="features" className="py-20 sm:py-28">
        <div className="landing-container px-4 sm:px-6 lg:px-8 xl:px-12">
          <ProductShowcase />
        </div>
      </section>

      {/* =========================================================================
          Bento Grid: Deep Dive Superpowers
         ========================================================================= */}
      <section id="dialer" className="py-20 sm:py-28 border-t border-border/60 bg-muted/10">
        <div className="landing-container px-4 sm:px-6 lg:px-8 xl:px-12 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-xs font-semibold px-3 py-1">
              Telecom Superpowers
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Built for Modern High-Velocity Sales &amp; Support
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              Enterprise features packaged into an intuitive browser interface.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Power Dialer */}
            <Card className="rounded-3xl border border-border/80 bg-card/80 p-6 sm:p-7 shadow-md flex flex-col justify-between hover:shadow-xl hover:border-primary/40 transition-all group">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Automated Multi-Line Dialer
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Upload CSV lead sheets and set up to 10x concurrent dialing. VoiceLink skips busy tones and dead lines, connecting only live answers to your headset.
                </p>
              </div>
              <div className="pt-6 border-t border-border/50 mt-6 flex items-center justify-between text-xs font-semibold text-primary">
                <span>Explore Power Dialer</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Card>

            {/* Card 2: 1-Click Voicemail Drop */}
            <Card className="rounded-3xl border border-border/80 bg-card/80 p-6 sm:p-7 shadow-md flex flex-col justify-between hover:shadow-xl hover:border-primary/40 transition-all group">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 group-hover:scale-105 transition-transform">
                  <Voicemail className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Instant Voicemail Drop
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Stop repeating your voicemail message 50 times a day. Click a single button to drop a crisp pre-recorded audio greeting and immediately move to the next call.
                </p>
              </div>
              <div className="pt-6 border-t border-border/50 mt-6 flex items-center justify-between text-xs font-semibold text-amber-500">
                <span>Manage Voicemails</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Card>

            {/* Card 3: Call Recordings & Transcripts */}
            <Card className="rounded-3xl border border-border/80 bg-card/80 p-6 sm:p-7 shadow-md flex flex-col justify-between hover:shadow-xl hover:border-primary/40 transition-all group">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 group-hover:scale-105 transition-transform">
                  <FileAudio className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Dual-Channel Audio Playback
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Automatic high-fidelity call recording stored securely with cryptographic verification. Review conversations, train new reps, and maintain audit trails.
                </p>
              </div>
              <div className="pt-6 border-t border-border/50 mt-6 flex items-center justify-between text-xs font-semibold text-emerald-500">
                <span>View Call Logs</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Card>

            {/* Card 4: Local Presence Caller ID */}
            <Card className="rounded-3xl border border-border/80 bg-card/80 p-6 sm:p-7 shadow-md flex flex-col justify-between hover:shadow-xl hover:border-primary/40 transition-all group">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500 group-hover:scale-105 transition-transform">
                  <Globe2 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Local Presence Routing
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Prospects are 3x more likely to answer numbers with familiar local area codes. VoiceLink automatically selects an outbound number that matches your recipient.
                </p>
              </div>
              <div className="pt-6 border-t border-border/50 mt-6 flex items-center justify-between text-xs font-semibold text-cyan-500">
                <span>Get Local Numbers</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Card>

            {/* Card 5: Two-Way SMS & MMS */}
            <Card className="rounded-3xl border border-border/80 bg-card/80 p-6 sm:p-7 shadow-md flex flex-col justify-between hover:shadow-xl hover:border-primary/40 transition-all group">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 group-hover:scale-105 transition-transform">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Omnichannel SMS Inbox
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Text leads before or after calls. Send photos, links, and documents via MMS with real-time delivery status checkmarks and template shortcuts.
                </p>
              </div>
              <div className="pt-6 border-t border-border/50 mt-6 flex items-center justify-between text-xs font-semibold text-indigo-500">
                <span>Explore Messaging</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Card>

            {/* Card 6: Enterprise Security */}
            <Card className="rounded-3xl border border-border/80 bg-card/80 p-6 sm:p-7 shadow-md flex flex-col justify-between hover:shadow-xl hover:border-primary/40 transition-all group">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Security &amp; 2FA Protection
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Hardware-backed TOTP two-factor authentication, encrypted TLS 1.3 WebRTC audio streams, role-based permissions, and immutable audit logging.
                </p>
              </div>
              <div className="pt-6 border-t border-border/50 mt-6 flex items-center justify-between text-xs font-semibold text-violet-500">
                <span>View Security Specs</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* =========================================================================
          Comparison Section: VoiceLink vs Legacy PBX
         ========================================================================= */}
      <section id="comparison" className="py-20 sm:py-28">
        <div className="landing-container px-4 sm:px-6 lg:px-8 xl:px-12">
          <ComparisonTable />
        </div>
      </section>

      {/* =========================================================================
          Testimonials Section
         ========================================================================= */}
      <section className="py-20 sm:py-28 border-t border-border/60 bg-muted/10">
        <div className="landing-container px-4 sm:px-6 lg:px-8 xl:px-12 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-xs font-semibold px-3 py-1">
              Customer Stories
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Loved by Revenue &amp; Support Teams Across the Globe
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, idx) => (
              <Card key={idx} className="rounded-3xl border border-border/80 bg-card p-7 sm:p-8 flex flex-col justify-between shadow-lg">
                <div className="space-y-4">
                  <div className="inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {t.metric}
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>

                <div className="pt-6 border-t border-border/50 mt-6 flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.author}
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-border"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{t.author}</h4>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          Pricing Section
         ========================================================================= */}
      <section id="pricing" className="py-20 sm:py-28 border-t border-border/60">
        <div className="landing-container px-4 sm:px-6 lg:px-8 xl:px-12">
          <PricingSection />
        </div>
      </section>

      {/* =========================================================================
          FAQ Section
         ========================================================================= */}
      <section id="faq" className="py-20 sm:py-28 border-t border-border/60 bg-muted/10">
        <div className="landing-container px-4 sm:px-6 lg:px-8 xl:px-12">
          <FaqSection />
        </div>
      </section>

      {/* =========================================================================
          High-Impact Call to Action Banner
         ========================================================================= */}
      <section className="py-20 sm:py-28 border-t border-border/60 relative overflow-hidden">
        <div className="landing-container px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="relative rounded-[2.5rem] border border-primary/30 bg-gradient-to-r from-primary/15 via-cyan-500/15 to-indigo-600/15 p-8 sm:p-14 lg:p-20 text-center shadow-2xl backdrop-blur overflow-hidden">
            {/* Ambient inner glow */}
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/30 rounded-full blur-3xl opacity-60" />

            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
              <Badge variant="secondary" className="px-3.5 py-1 text-xs font-semibold">
                ⚡ Ready in 60 seconds
              </Badge>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                Start Calling &amp; Messaging Your Customers Today
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
                No contracts. No physical hardware. Claim your virtual phone number and place your first international call in less than two minutes.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all active:scale-98"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/calls/dialpad"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-border/80 bg-background/80 px-7 py-4 text-base font-semibold text-foreground hover:bg-muted transition-all"
                >
                  <Headphones className="h-5 w-5 text-primary" />
                  <span>Try Softphone Now</span>
                </Link>
              </div>

              <p className="text-xs text-muted-foreground pt-2">
                100 free voice minutes included on signup. No credit card required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          Comprehensive Modern Footer
         ========================================================================= */}
      <footer className="border-t border-border/60 bg-card/60 py-12 sm:py-16">
        <div className="landing-container px-4 sm:px-6 lg:px-8 xl:px-12 space-y-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Col 1: Brand Info */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2.5 font-bold text-lg text-foreground">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <Phone className="h-4 w-4" />
                </div>
                <span>VoiceLink</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-sm leading-relaxed">
                Modern WebRTC cloud telephony, automated power dialers, and two-way international messaging for high-velocity teams.
              </p>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-500 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All Telephony Systems Operational</span>
              </div>
            </div>

            {/* Col 2: Product */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Product</p>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li><Link href="/calls/dialpad" className="hover:text-foreground transition-colors">Web Softphone</Link></li>
                <li><Link href="/dialer" className="hover:text-foreground transition-colors">Power Dialer</Link></li>
                <li><Link href="/numbers" className="hover:text-foreground transition-colors">Virtual Numbers</Link></li>
                <li><Link href="/messages" className="hover:text-foreground transition-colors">SMS &amp; MMS</Link></li>
                <li><Link href="/voicemails" className="hover:text-foreground transition-colors">Voicemail Box</Link></li>
              </ul>
            </div>

            {/* Col 3: Resources */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Platform</p>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li><Link href="/billing" className="hover:text-foreground transition-colors">Pricing &amp; Plans</Link></li>
                <li><Link href="/settings" className="hover:text-foreground transition-colors">API Keys</Link></li>
                <li><a href="#faq" className="hover:text-foreground transition-colors">Knowledge Base</a></li>
                <li><a href="#comparison" className="hover:text-foreground transition-colors">Carrier Comparison</a></li>
              </ul>
            </div>

            {/* Col 4: Legal & Trust */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">Compliance</p>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li><span className="hover:text-foreground cursor-pointer">SOC2 Compliance</span></li>
                <li><span className="hover:text-foreground cursor-pointer">10DLC A2P Registry</span></li>
                <li><span className="hover:text-foreground cursor-pointer">Terms of Service</span></li>
                <li><span className="hover:text-foreground cursor-pointer">Privacy Policy</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/50 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <div>
              &copy; {new Date().getFullYear()} VoiceLink Cloud Inc. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <span>WebRTC Opus HD Voice</span>
              <span>Twilio / Telnyx Tier-1 Gateway</span>
              <span>Carrier SLA: 99.99%</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
