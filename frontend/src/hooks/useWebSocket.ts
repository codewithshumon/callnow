"use client";

import { useEffect, useState } from "react";
import {
  connectWebSocket,
  disconnectWebSocket,
  joinCampaignRoom,
  leaveCampaignRoom,
  isConnected,
  onWsEvent,
} from "@/lib/websocket";
import { useAuthStore } from "@/store/authStore";

export function useWebSocket() {
  const user = useAuthStore((s) => s.user);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function init() {
      try {
        await connectWebSocket();
        if (!cancelled) setConnected(true);
      } catch {
        if (!cancelled) setConnected(false);
      }
    }

    init();

    const interval = setInterval(() => {
      if (!cancelled) setConnected(isConnected());
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      disconnectWebSocket();
      setConnected(false);
    };
  }, [user]);

  return {
    isConnected: connected,
    joinRoom: joinCampaignRoom,
    leaveRoom: leaveCampaignRoom,
    onEvent: onWsEvent,
  };
}
