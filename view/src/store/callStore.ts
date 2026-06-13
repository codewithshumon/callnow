"use client";

import { create } from "zustand";
import type { Call, CallStatus } from "@/lib/types";

interface InboundCall {
  callSid: string;
  from: string;
  to: string;
}

interface ActiveCall {
  callSid: string;
  from: string;
  to: string;
  status: CallStatus;
  duration: number;
  isMuted: boolean;
  isOnHold: boolean;
  startTime: number;
}

interface CallState {
  // ── State ──────────────────────────────────────────────
  activeCall: ActiveCall | null;
  incomingCall: InboundCall | null;
  isCallOverlayOpen: boolean;
  callHistory: Call[];

  // ── Actions ─────────────────────────────────────────────
  setIncomingCall: (call: InboundCall | null) => void;
  acceptCall: () => void;
  declineCall: () => void;
  startCall: (callSid: string, from: string, to: string) => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleHold: () => void;
  sendDigits: (dtmf: string) => void;
  updateDuration: (seconds: number) => void;
  setCallStatus: (status: CallStatus) => void;
  setCallHistory: (calls: Call[]) => void;
  addCallToHistory: (call: Call) => void;
}

/** Internal: start a 1-second interval that updates call duration */
let durationTimer: ReturnType<typeof setInterval> | null = null;

function startDurationTimer() {
  stopDurationTimer();
  durationTimer = setInterval(() => {
    const { activeCall, updateDuration } = useCallStore.getState();
    if (!activeCall) {
      stopDurationTimer();
      return;
    }
    const elapsed = Math.floor((Date.now() - activeCall.startTime) / 1000);
    updateDuration(elapsed);
  }, 1000);
}

function stopDurationTimer() {
  if (durationTimer) {
    clearInterval(durationTimer);
    durationTimer = null;
  }
}

export const useCallStore = create<CallState>()((set, get) => ({
  // ── Initial state ──────────────────────────────────────
  activeCall: null,
  incomingCall: null,
  isCallOverlayOpen: false,
  callHistory: [],

  // ── Actions ─────────────────────────────────────────────

  setIncomingCall: (call) =>
    set({ incomingCall: call, isCallOverlayOpen: !!call }),

  acceptCall: () => {
    const incoming = get().incomingCall;
    if (!incoming) return;
    set({
      activeCall: {
        callSid: incoming.callSid,
        from: incoming.from,
        to: incoming.to,
        status: "in-progress",
        duration: 0,
        isMuted: false,
        isOnHold: false,
        startTime: Date.now(),
      },
      incomingCall: null,
      isCallOverlayOpen: false,
    });
    startDurationTimer();
  },

  declineCall: () =>
    set({ incomingCall: null, isCallOverlayOpen: false }),

  startCall: (callSid, from, to) => {
    set({
      activeCall: {
        callSid,
        from,
        to,
        status: "ringing",
        duration: 0,
        isMuted: false,
        isOnHold: false,
        startTime: Date.now(),
      },
    });
    startDurationTimer();
  },

  endCall: () => {
    stopDurationTimer();
    set({ activeCall: null });
  },

  toggleMute: () =>
    set((state) =>
      state.activeCall
        ? {
            activeCall: {
              ...state.activeCall,
              isMuted: !state.activeCall.isMuted,
            },
          }
        : {}
    ),

  toggleHold: () =>
    set((state) =>
      state.activeCall
        ? {
            activeCall: {
              ...state.activeCall,
              isOnHold: !state.activeCall.isOnHold,
            },
          }
        : {}
    ),

  /** Queue DTMF digits to send (actual sending handled by WebRTC client). */
  sendDigits: (_dtmf) => {
    // Digits are sent via the WebRTC client (webrtc.ts).
    // This store action exists so the UI layer has a consistent API.
    // The actual sendDigits call is made by webrtc.sendDigits()
  },

  updateDuration: (seconds) =>
    set((state) =>
      state.activeCall
        ? { activeCall: { ...state.activeCall, duration: seconds } }
        : {}
    ),

  setCallStatus: (status) =>
    set((state) =>
      state.activeCall
        ? { activeCall: { ...state.activeCall, status } }
        : {}
    ),

  setCallHistory: (calls) => set({ callHistory: calls }),

  addCallToHistory: (call) =>
    set((state) => ({
      callHistory: [call, ...state.callHistory],
    })),
}));

// ── Export timer controls for use in hooks ─────────────────

export { startDurationTimer, stopDurationTimer };
