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
  const accessToken = useAuthStore((s) => s.accessToken);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    try {
      connectWebSocket();
      setConnected(true);
    } catch {
      setConnected(false);
    }
    // Poll connection status
    const interval = setInterval(() => setConnected(isConnected()), 5000);
    return () => {
      clearInterval(interval);
      disconnectWebSocket();
      setConnected(false);
    };
  }, [accessToken]);

  return {
    isConnected: connected,
    joinRoom: joinCampaignRoom,
    leaveRoom: leaveCampaignRoom,
    onEvent: onWsEvent,
  };
}
