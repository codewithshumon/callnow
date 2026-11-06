import Link from "next/link";
import { Phone, PhoneOff, ArrowLeft, Home, PhoneCall, History, MessageSquare, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-background text-foreground p-6 sm:p-12 selection:bg-primary/20">
      {/* Top Navbar */}
      <div className="flex items-center justify-between w-full max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-foreground group">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm group-hover:scale-105 transition-transform">
            <Phone className="h-4 w-4" />
          </div>
          <span>VoiceLink</span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Home</span>
        </Link>
      </div>

      {/* Main 404 Body */}
      <div className="max-w-xl mx-auto text-center space-y-6 my-auto py-12">
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 border border-primary/20 text-primary shadow-2xl">
          <PhoneOff className="h-12 w-12 text-primary" />
          <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[11px] font-mono font-bold">
            !
          </span>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-xs font-mono text-muted-foreground">
            <Compass className="h-3.5 w-3.5 text-primary" />
            <span>SIP 404: Address Incomplete</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Line Disconnected
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
            The page or telephony endpoint you are trying to reach does not exist, has been released, or has moved to a new route.
          </p>
        </div>

        {/* Quick Route Shortcuts */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/calls/dialpad"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs sm:text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition active:scale-98"
          >
            <PhoneCall className="h-4 w-4" />
            <span>Open Dialpad</span>
          </Link>

          <Link
            href="/calls"
            className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-5 py-3 text-xs sm:text-sm font-semibold text-foreground hover:bg-muted shadow-sm transition"
          >
            <History className="h-4 w-4 text-muted-foreground" />
            <span>Call History</span>
          </Link>

          <Link
            href="/messages"
            className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-5 py-3 text-xs sm:text-sm font-semibold text-foreground hover:bg-muted shadow-sm transition"
          >
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span>SMS Inbox</span>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground border-t border-border/40 pt-6">
        <span>VoiceLink Cloud Telephony Platform &bull; All SIP Gateways Operational</span>
      </div>
    </div>
  );
}
