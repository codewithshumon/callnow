"use client";

import { useEffect } from "react";
import { useCallStore } from "@/store/callStore";
import type { WsCallInboundEvent } from "@/lib/types";
import { onWsEvent } from "@/lib/websocket";

export function useInboundCall() {
  const incomingCall = useCallStore((s) => s.incomingCall);
  const isOpen = useCallStore((s) => s.isCallOverlayOpen);
  const acceptCall = useCallStore((s) => s.acceptCall);
  const declineCall = useCallStore((s) => s.declineCall);

  useEffect(() => {
    // Listen for inbound calls via WebSocket
    const unsub = onWsEvent("call:inbound", (_data: WsCallInboundEvent["data"]) => {
      // Store binding happens in websocket.ts — this hook just exposes state
    });
    return unsub;
  }, []);

  return { incomingCall, isOpen, acceptCall, declineCall };
}
