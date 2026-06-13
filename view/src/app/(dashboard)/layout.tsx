"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { connectWebSocket, disconnectWebSocket } from "@/lib/websocket";
import { initializeCallClient, destroyCallClient } from "@/lib/webrtc";
import { get } from "@/lib/api";
import type { CallToken } from "@/lib/types";
import Sidebar from "@/components/layout/Sidebar";
import InboundCallOverlay from "@/components/calling/InboundCallOverlay";
import ActiveCallBar from "@/components/calling/ActiveCallBar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const refreshSession = useAuthStore((s) => s.refreshSession);
  const isLoading = useAuthStore((s) => s.isLoading);
  const wsConnected = useRef(false);
  const webrtcInitialized = useRef(false);

  // ── Auth guard ──────────────────────────────────────────
  useEffect(() => {
    if (isLoading) return;
    if (!accessToken && !refreshToken) {
      router.push("/login");
      return;
    }
    // Try refresh on mount if access token expired
    if (!accessToken && refreshToken) {
      refreshSession().catch(() => router.push("/login"));
    }
  }, [accessToken, refreshToken, refreshSession, isLoading, router]);

  // ── WebSocket connection ────────────────────────────────
  useEffect(() => {
    if (!accessToken || wsConnected.current) return;
    try {
      connectWebSocket();
      wsConnected.current = true;
    } catch {
      // Will retry on token refresh
    }
    return () => {
      disconnectWebSocket();
      wsConnected.current = false;
    };
  }, [accessToken]);

  // ── WebRTC device init ──────────────────────────────────
  useEffect(() => {
    if (!accessToken || webrtcInitialized.current) return;
    async function init() {
      try {
        const res = await get<CallToken>("/calls/token");
        await initializeCallClient(res.data);
        webrtcInitialized.current = true;
      } catch {
        // Call token may not be available yet — retry later
      }
    }
    init();
    return () => {
      destroyCallClient();
      webrtcInitialized.current = false;
    };
  }, [accessToken]);

  // ── Request browser notification permission ─────────────
  useEffect(() => {
    if (!accessToken) return;
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, [accessToken]);

  if (isLoading || (!accessToken && !refreshToken)) {
    return null; // or a global loading spinner
  }

  return (
    <div className="flex min-h-full">
      <Sidebar />
      {/* Main content area — offset by sidebar width on desktop */}
      <main className="flex-1 lg:pl-60">
        {children}
      </main>

      {/* Global call UI components */}
      <InboundCallOverlay />
      <ActiveCallBar />
    </div>
  );
}
