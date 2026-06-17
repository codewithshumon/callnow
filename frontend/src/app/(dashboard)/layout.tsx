"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
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
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isLoading = useAuthStore((s) => s.isLoading);
  const refreshSession = useAuthStore((s) => s.refreshSession);
  const hasTriedRefresh = useRef(false);
  const wsConnected = useRef(false);
  const webrtcInitialized = useRef(false);

  // ── Auth guard ──────────────────────────────────────────
  // On mount: if user is restored from localStorage but tokens are missing
  // (fresh page load), try refreshing via the refresh_token cookie.
  useEffect(() => {
    if (isLoading) return;

    if (!accessToken && user && !hasTriedRefresh.current) {
      hasTriedRefresh.current = true;
      refreshSession().catch(() => {
        useAuthStore.getState().logout();
        router.push("/login");
      });
      return;
    }

    if (!user) {
      router.push("/login");
    }
  }, [user, accessToken, isLoading, refreshSession, router]);

  // ── WebSocket connection ────────────────────────────────
  useEffect(() => {
    if (!accessToken || wsConnected.current) return;
    async function init() {
      try {
        await connectWebSocket();
        wsConnected.current = true;
      } catch {
        // retry on next token change
      }
    }
    init();
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
        // retry later
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

  if (isLoading) return null;
  if (!user) return null; // auth guard redirects

  return (
    <div className="flex min-h-full">
      <Sidebar />
      <main className="flex-1 lg:pl-60">{children}</main>
      <InboundCallOverlay />
      <ActiveCallBar />
    </div>
  );
}
