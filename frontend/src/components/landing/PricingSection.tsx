"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function PricingSection() {
  const [annual, setAnnual] = useState(true);

  const plans = [
    {
      name: "Free Trial",
      badge: "Get Started",
      description: "Ideal for testing browser softphone calls and individual users.",
      monthlyPrice: 0,
      annualPrice: 0,
      popular: false,
      features: [
        "1 Virtual Phone Number",
        "100 Included Voice Minutes",
        "WebRTC In-Browser Softphone",
        "Two-Way SMS & MMS",
        "Basic Call History & CDR",
        "Standard WebRTC HD Audio",
      ],
      cta: "Start Free",
      href: "/register",
    },
    {
      name: "Pro",
      badge: "Most Popular",
      description: "For sales professionals, agencies, and high-volume outbound dialers.",
      monthlyPrice: 29.99,
      annualPrice: 23.99,
      popular: true,
      features: [
        "5 Virtual Phone Numbers",
        "1,000 Included Voice Minutes",
        "Intelligent Power Dialer Enabled",
        "5x Multi-Line Concurrency",
        "Automated Voicemail Drop",
        "Call Recording & Audio Transcripts",
        "Local Presence Caller ID Matching",
        "Priority Carrier Route Quality",
      ],
      cta: "Start 14-Day Pro Trial",
      href: "/register",
    },
    {
      name: "Business",
      badge: "Scaling Teams",
      description: "For established sales forces, support desks, and multi-agent teams.",
      monthlyPrice: 99.99,
      annualPrice: 79.99,
      popular: false,
      features: [
        "20 Virtual Phone Numbers",
        "5,000 Included Voice Minutes",
        "High-Speed Power Dialer (10x Concurrency)",
        "Team Shared Inboxes & Lines",
        "Unlimited Two-Way Messaging",
        "DNC Auto-Scrubbing & Scrub Filters",
        "REST API & Real-time Webhooks",
        "99.99% Carrier SLA & 24/7 Support",
      ],
      cta: "Deploy Business",
      href: "/register",
    },
  ];

  return (
    <div className="space-y-10">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-xs font-semibold px-3 py-1">
          Simple, Transparent Pricing
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Predictable Pricing with Zero Long-Term Contracts
        </h2>
        <p className="text-muted-foreground text-base sm:text-lg">
          No hidden PBX maintenance fees or roaming penalties. Switch plans or cancel anytime in one click.
        </p>

        {/* Monthly vs Annual Toggle */}
        <div className="inline-flex items-center gap-3 p-1.5 rounded-full border border-border/80 bg-muted/50 backdrop-blur mt-4">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all",
              !annual
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5",
              annual
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>Annual</span>
            <span className={cn(
              "text-[10px] font-mono px-1.5 py-0.5 rounded-full",
              annual ? "bg-white/20 text-white" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold"
            )}>
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {plans.map((p) => {
          const price = annual ? p.annualPrice : p.monthlyPrice;
          return (
            <div
              key={p.name}
              className={cn(
                "relative rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-300",
                p.popular
                  ? "border-2 border-primary bg-gradient-to-b from-primary/5 via-card to-card shadow-2xl shadow-primary/10 ring-4 ring-primary/10 -translate-y-2"
                  : "border border-border/80 bg-card/80 shadow-lg hover:border-border hover:shadow-xl"
              )}
            >
              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                  ★ Most Popular
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-foreground">{p.name}</h3>
                    <Badge variant={p.popular ? "default" : "secondary"} className="text-xs">
                      {p.badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 min-h-[36px]">
                    {p.description}
                  </p>
                </div>

                <div className="flex items-baseline gap-1.5 border-b border-border/50 pb-6">
                  <span className="text-4xl sm:text-5xl font-mono font-extrabold tracking-tight text-foreground">
                    ${price.toFixed(2)}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    / month
                  </span>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Included capabilities:
                  </p>
                  <ul className="space-y-2.5">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8">
                <Link
                  href={p.href}
                  className={cn(
                    "w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all shadow-md",
                    p.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border/80 bg-background text-foreground hover:bg-muted"
                  )}
                >
                  <span>{p.cta}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
