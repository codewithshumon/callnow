"use client";

import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/authStore";
import {
  useMessageStore,
} from "@/store/messageStore";
import { useCallStore } from "@/store/callStore";
import type {
  WsMessageNewEvent,
  WsMessageStatusEvent,
  WsCallInboundEvent,
  WsCallStatusEvent,
  WsCampaignProgressEvent,
  WsCampaignCompleteEvent,
} from "@/lib/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000";

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// ── Typed event callbacks ───────────────────────────────────

type EventCallbackMap = {
  "message:new": (data: WsMessageNewEvent["data"]) => void;
  "message:status": (data: WsMessageStatusEvent["data"]) => void;
  "call:inbound": (data: WsCallInboundEvent["data"]) => void;
  "call:status": (data: WsCallStatusEvent["data"]) => void;
  "campaign:progress": (data: WsCampaignProgressEvent["data"]) => void;
  "campaign:complete": (data: WsCampaignCompleteEvent["data"]) => void;
};

// ── Connect ─────────────────────────────────────────────────

export function connectWebSocket(): Socket {
  if (socket?.connected) return socket;

  const token = useAuthStore.getState().accessToken;
  if (!token) {
    throw new Error("Cannot connect WebSocket: not authenticated");
  }

  socket = io(WS_URL, {
    path: "/ws",
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
  });

  socket.on("connect", () => {
    reconnectAttempts = 0;
    console.debug("[WS] Connected:", socket?.id);
  });

  socket.on("disconnect", (reason) => {
    console.debug("[WS] Disconnected:", reason);
  });

  // ── Reconnection with exponential backoff ─────────────────

  socket.io.on("reconnect_attempt", (attempt) => {
    reconnectAttempts = attempt;
    const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
    console.debug(`[WS] Reconnect attempt ${attempt}, delay: ${delay}ms`);
  });

  socket.io.on("reconnect_failed", () => {
    console.error("[WS] Max reconnect attempts reached");
    // Could show a persistent "Connection lost" banner here
  });

  socket.on("connect_error", (error) => {
    console.error("[WS] Connection error:", error.message);
  });

  // ── Built-in store bindings ───────────────────────────────
  // These auto-update stores when events arrive

  socket.on("message:new", (data: WsMessageNewEvent["data"]) => {
    const store = useMessageStore.getState();
    store.addMessage(data.conversationId, data.message);
    store.incrementUnread(data.conversationId);
  });

  socket.on("message:status", (data: WsMessageStatusEvent["data"]) => {
    useMessageStore.getState().updateMessageStatus(data.messageId, data.status);
  });

  socket.on("call:inbound", (data: WsCallInboundEvent["data"]) => {
    useCallStore.getState().setIncomingCall({
      callSid: data.callSid,
      from: data.from,
      to: data.to,
    });
  });

  socket.on("call:status", (data: WsCallStatusEvent["data"]) => {
    const callStore = useCallStore.getState();
    if (callStore.activeCall?.callSid === data.callSid) {
      callStore.setCallStatus(data.status);
      if (data.duration !== undefined) {
        callStore.updateDuration(data.duration);
      }
    }
  });

  socket.on(
    "campaign:progress",
    (data: WsCampaignProgressEvent["data"]) => {
      // Campaign progress is consumed by the campaign live page hook;
      // this default handler is a no-op (the hook subscribes via addEventListener)
    }
  );

  socket.on(
    "campaign:complete",
    (data: WsCampaignCompleteEvent["data"]) => {
      // Same — consumed by the campaign live page hook
    }
  );

  return socket;
}

// ── Disconnect ──────────────────────────────────────────────

export function disconnectWebSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    reconnectAttempts = 0;
  }
}

// ── Get socket instance ─────────────────────────────────────

export function getSocket(): Socket | null {
  return socket;
}

// ── Room management ─────────────────────────────────────────

export function joinCampaignRoom(campaignId: string): void {
  socket?.emit("join-campaign", { campaignId });
}

export function leaveCampaignRoom(campaignId: string): void {
  socket?.emit("leave-campaign", { campaignId });
}

// ── Subscribe to specific events (for hooks) ────────────────

export function onWsEvent<K extends keyof EventCallbackMap>(
  event: K,
  callback: EventCallbackMap[K]
): () => void {
  socket?.on(event as string, callback as (...args: any[]) => void);
  return () => {
    socket?.off(event as string, callback as (...args: any[]) => void);
  };
}

// ── Connection state ────────────────────────────────────────

export function isConnected(): boolean {
  return socket?.connected ?? false;
}
