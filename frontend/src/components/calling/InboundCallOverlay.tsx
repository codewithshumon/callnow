"use client";

import { useEffect, useCallback, useState } from "react";
import { Phone, PhoneOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCallStore } from "@/store/callStore";

export default function InboundCallOverlay() {
  const incomingCall = useCallStore((s) => s.incomingCall);
  const activeCall = useCallStore((s) => s.activeCall);
  const isOpen = useCallStore((s) => s.isCallOverlayOpen);
  const acceptCall = useCallStore((s) => s.acceptCall);
  const declineCall = useCallStore((s) => s.declineCall);
  const [timeLeft, setTimeLeft] = useState(30);

  // Auto-timeout: decline after 30 seconds
  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(30);
      return;
    }
    if (timeLeft <= 0) {
      declineCall();
      return;
    }
    const t = setInterval(() => setTimeLeft((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [isOpen, timeLeft, declineCall]);

  // Tab title change
  useEffect(() => {
    if (isOpen) {
      document.title = "📞 Incoming call...";
      return () => {
        document.title = "VoiceLink";
      };
    }
  }, [isOpen]);

  // Browser notification
  useEffect(() => {
    if (!isOpen || !incomingCall) return;
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification("Incoming Call", {
        body: `From: ${incomingCall.from}`,
        icon: "/favicon.ico",
      });
    }
  }, [isOpen, incomingCall]);

  if (!isOpen || !incomingCall) return null;

  const isCallWaiting = !!activeCall;
  const callerId = incomingCall.from || "Unknown";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-background p-8 text-center shadow-2xl">
        <Avatar className="mx-auto mb-4 h-20 w-20">
          <AvatarFallback className="text-2xl">
            {callerId[0] || "?"}
          </AvatarFallback>
        </Avatar>

        <h2 className="text-xl font-semibold">
          {isCallWaiting ? "Call Waiting" : "Incoming Call"}
        </h2>
        <p className="mt-1 text-lg">{callerId}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {isCallWaiting ? "You're already on a call" : `Auto-decline in ${timeLeft}s`}
        </p>

        <div className="mt-8 flex justify-center gap-6">
          <button
            onClick={declineCall}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive text-white hover:bg-destructive/80 transition-colors"
            aria-label="Decline"
          >
            <PhoneOff className="h-6 w-6" />
          </button>

          <button
            onClick={acceptCall}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
            aria-label="Accept"
          >
            <Phone className="h-6 w-6" />
          </button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Decline sends caller to voicemail
        </p>
      </div>
    </div>
  );
}
