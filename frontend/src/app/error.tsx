"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, RotateCw, Home, Phone, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global WebRTC/Application error caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-background text-foreground p-6 sm:p-12 selection:bg-primary/20">
      <div className="flex items-center justify-between w-full max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Phone className="h-4 w-4" />
          </div>
          <span>VoiceLink</span>
        </Link>
      </div>

      <div className="max-w-xl mx-auto text-center space-y-6 my-auto py-12">
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-destructive/10 border border-destructive/20 text-destructive shadow-2xl">
          <AlertOctagon className="h-12 w-12 text-destructive animate-pulse" />
        </div>

        <div className="space-y-2">
          <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive text-xs font-mono">
            {error.digest ? `Digest: ${error.digest.slice(0, 10)}` : "Runtime Exception"}
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Transmission Interrupted
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
            An unexpected error occurred while executing this operation. Your phone lines and account remain secure.
          </p>
        </div>

        {error.message && (
          <div className="rounded-2xl border border-border/80 bg-muted/40 p-3.5 text-left text-xs font-mono text-muted-foreground break-all max-w-md mx-auto">
            {error.message}
          </div>
        )}

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            onClick={reset}
            className="rounded-xl bg-primary px-5 py-3 text-xs sm:text-sm font-semibold text-primary-foreground shadow-md gap-2"
          >
            <RotateCw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>

          <Link
            href="/calls/dialpad"
            className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-5 py-3 text-xs sm:text-sm font-semibold text-foreground hover:bg-muted shadow-sm transition"
          >
            <Home className="h-4 w-4 text-muted-foreground" />
            <span>Back to Softphone</span>
          </Link>
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground border-t border-border/40 pt-6">
        <span>Need assistance? Contact support@voicelink.cloud</span>
      </div>
    </div>
  );
}
