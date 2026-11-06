"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Do I need a physical SIM card or desk phone to make calls?",
    a: "No physical equipment is required. VoiceLink operates 100% inside your web browser (Chrome, Safari, Edge, Firefox) using modern WebRTC protocols. Your microphone and speakers or headphones are all you need.",
  },
  {
    q: "How does the Power Dialer work?",
    a: "Upload your contact list via CSV, configure your calling line, and click Start Campaign. VoiceLink sequentially or concurrently dials prospects, detects live human answers vs answering machines, and immediately connects answered calls to your headset with zero transfer delay.",
  },
  {
    q: "Can I choose phone numbers from specific countries or cities?",
    a: "Yes. VoiceLink gives you access to local, national, and toll-free virtual numbers across 50+ countries including the United States, Canada, the United Kingdom, Australia, and European nations. You can search by area code or country in real time.",
  },
  {
    q: "Can I receive incoming calls when my browser is open?",
    a: "Yes! VoiceLink maintains real-time WebSocket connectivity. When a contact calls your virtual number, you receive an instant audio ringtone and an incoming call HUD directly in your browser with 1-click answer.",
  },
  {
    q: "Is call recording and voicemail transcription supported?",
    a: "Yes. On Pro and Business tiers, you can enable 1-click dual-channel call recording. Unanswered inbound calls automatically go to your digital voicemail box, where audio files can be played back or downloaded.",
  },
  {
    q: "Can I switch or cancel my plan at any time?",
    a: "Absolutely. All subscriptions are pay-as-you-go with no long-term carrier commitments or early cancellation fees. You can upgrade, downgrade, or release numbers directly from your Billing dashboard.",
  },
];

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (i: number) => {
    setOpenIdx(openIdx === i ? null : i);
  };

  return (
    <div className="space-y-8 w-full mx-auto">
      <div className="text-center space-y-3">
        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-xs font-semibold px-3 py-1">
          Got Questions?
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Frequently Asked Questions
        </h2>
        <p className="text-muted-foreground text-base">
          Everything you need to know about getting started with VoiceLink cloud telephony.
        </p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, i) => {
          const isOpen = openIdx === i;
          return (
            <div
              key={i}
              className={cn(
                "rounded-2xl border transition-all duration-200 overflow-hidden",
                isOpen
                  ? "border-primary/50 bg-card shadow-md"
                  : "border-border/80 bg-card/60 hover:border-border"
              )}
            >
              <button
                type="button"
                onClick={() => toggle(i)}
                className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 focus:outline-none"
              >
                <span className="font-semibold text-base sm:text-lg text-foreground">
                  {faq.q}
                </span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform duration-200 shrink-0",
                    isOpen && "rotate-180 text-primary"
                  )}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-sm sm:text-base text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
