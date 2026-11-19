"use client";

import { useState, useEffect, useRef } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Sparkles,
  Radio,
  Clock,
  CheckCircle2,
  Wifi,
  Activity,
  Delete,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { playDtmfTone } from "@/lib/dtmf";
import { cn } from "@/lib/utils";

const KEYPAD = [
  { digit: "1", sub: "" },
  { digit: "2", sub: "ABC" },
  { digit: "3", sub: "DEF" },
  { digit: "4", sub: "GHI" },
  { digit: "5", sub: "JKL" },
  { digit: "6", sub: "MNO" },
  { digit: "7", sub: "PQRS" },
  { digit: "8", sub: "TUV" },
  { digit: "9", sub: "WXYZ" },
  { digit: "*", sub: "" },
  { digit: "0", sub: "+" },
  { digit: "#", sub: "" },
];

const PRESETS = [
  { label: "US Support", number: "+1 (800) 555-0199", country: "🇺🇸" },
  { label: "London Desk", number: "+44 20 7946 0991", country: "🇬🇧" },
  { label: "Sydney Branch", number: "+61 2 9374 4000", country: "🇦🇺" },
];

export default function InteractiveDialerDemo() {
  const [number, setNumber] = useState("+1 (800) 555-0199");
  const [inCall, setInCall] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (inCall && !isOnHold) {
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [inCall, isOnHold]);

  const handleDigit = (d: string) => {
    if (soundEnabled) {
      playDtmfTone(d, 120);
    }
    setNumber((prev) => (prev.length < 20 ? prev + d : prev));
  };

  const handleStartCall = () => {
    if (!number) return;
    setInCall(true);
    setDuration(0);
    setIsMuted(false);
    setIsOnHold(false);
    if (soundEnabled) {
      playDtmfTone("5", 200);
    }
  };

  const handleEndCall = () => {
    setInCall(false);
    setDuration(0);
    setIsMuted(false);
    setIsOnHold(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Decorative ambient aura behind the phone */}
      <div className="absolute -inset-1.5 rounded-[2.5rem] bg-gradient-to-r from-blue-600/40 via-cyan-500/40 to-indigo-600/40 opacity-70 blur-xl transition-all group-hover:opacity-100" />

      {/* Main glass card */}
      <div className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-card/90 p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
        {/* Top Header bar with status indicators */}
        <div className="flex items-center justify-between border-b border-border/50 pb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold tracking-wide text-foreground">
              WebRTC HD Voice
            </span>
            <Badge variant="outline" className="border-border/60 bg-muted/40 text-[10px] font-mono text-muted-foreground px-1.5 py-0">
              Opus 48kHz
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              title={soundEnabled ? "Mute DTMF sound" : "Enable DTMF sound"}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-primary" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </button>
            <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-500 font-medium">
              <Wifi className="h-3 w-3" />
              18ms
            </div>
          </div>
        </div>

        {/* Display Screen */}
        <div className="my-5">
          {inCall ? (
            /* Active Call Screen */
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 via-card to-card p-4 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 ring-8 ring-emerald-500/10 animate-pulse">
                <Phone className="h-6 w-6" />
              </div>

              <div>
                <p className="text-xs uppercase font-mono tracking-widest text-emerald-500 font-semibold">
                  {isOnHold ? "Call On Hold" : "Connected (HD Audio)"}
                </p>
                <h4 className="text-xl sm:text-2xl font-mono font-bold tracking-tight text-foreground mt-0.5">
                  {number}
                </h4>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1 text-xs font-mono">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span>{formatTime(duration)}</span>
                  <span className="text-muted-foreground">• Caller ID: +1 202-555-0199</span>
                </div>
              </div>

              {/* Animated Sound Waveform Bars */}
              <div className="flex items-center justify-center gap-1 h-8 pt-1">
                {[40, 75, 100, 60, 90, 45, 80, 95, 50, 70, 85, 40].map((h, i) => (
                  <span
                    key={i}
                    className={cn(
                      "w-1 rounded-full transition-all duration-300",
                      isOnHold
                        ? "bg-muted-foreground/30 h-1.5"
                        : "bg-emerald-500 animate-pulse"
                    )}
                    style={{
                      height: isOnHold ? "6px" : `${Math.max(6, (h * (i % 2 === 0 ? 0.9 : 0.6)))}%`,
                      animationDelay: `${i * 0.08}s`,
                    }}
                  />
                ))}
              </div>

              {/* In-Call Controls */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full border transition",
                    isMuted
                      ? "border-red-500 bg-red-500/20 text-red-500"
                      : "border-border bg-muted/50 text-foreground hover:bg-muted"
                  )}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsOnHold(!isOnHold)}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full border transition",
                    isOnHold
                      ? "border-amber-500 bg-amber-500/20 text-amber-500"
                      : "border-border bg-muted/50 text-foreground hover:bg-muted"
                  )}
                  title={isOnHold ? "Resume" : "Hold"}
                >
                  {isOnHold ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={handleEndCall}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-500 active:scale-95"
                  title="Hang Up"
                >
                  <PhoneOff className="h-5 w-5" />
                </button>
              </div>
            </div>
          ) : (
            /* Idle Number Input Box */
            <div className="rounded-2xl border border-border/80 bg-muted/30 p-3.5 text-center">
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                <span>Interactive Softphone</span>
                {number && (
                  <button
                    type="button"
                    onClick={() => setNumber("")}
                    className="hover:text-foreground transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-transparent text-center font-mono text-2xl font-bold tracking-wider text-foreground outline-none placeholder:text-muted-foreground/30"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Click keypad numbers below to hear DTMF audio tones
              </p>
            </div>
          )}
        </div>

        {/* 12-Button Dialpad */}
        {!inCall && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {KEYPAD.map(({ digit, sub }) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigit(digit)}
                  className="flex flex-col items-center justify-center rounded-xl border border-border/60 bg-card/60 py-2.5 text-foreground shadow-sm transition hover:border-primary/40 hover:bg-primary/5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <span className="font-mono text-xl font-semibold leading-none">
                    {digit}
                  </span>
                  <span className="h-3 text-[10px] font-medium tracking-widest text-muted-foreground">
                    {sub}
                  </span>
                </button>
              ))}
            </div>

            {/* Action Bar: Delete digit + Start Call */}
            <div className="flex items-center gap-2.5 pt-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setNumber((n) => n.slice(0, -1))}
                disabled={!number}
                className="h-12 w-12 rounded-xl shrink-0"
                title="Backspace"
              >
                <Delete className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                onClick={handleStartCall}
                disabled={!number}
                className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white shadow-lg transition active:scale-98"
              >
                <Phone className="mr-2 h-4 w-4 animate-pulse" />
                Test Interactive Call
              </Button>
            </div>

            {/* Quick Presets */}
            <div className="border-t border-border/50 pt-3">
              <p className="text-[11px] font-medium text-muted-foreground mb-1.5 text-center">
                Try clicking a sample global route:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setNumber(p.number)}
                    className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition"
                  >
                    <span>{p.country}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span>No plugins or SIP hardware needed. Ready on signup.</span>
        </div>
      </div>
    </div>
  );
}
