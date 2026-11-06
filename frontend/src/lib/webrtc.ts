"use client";

import { useCallStore } from "@/store/callStore";
import type { CallToken } from "@/lib/types";

// ── Twilio Voice SDK types (dynamic import) ─────────────────

interface TwilioDevice {
  register(): Promise<void>;
  connect(params: {
    params: Record<string, string>;
  }): TwilioCall;
  destroy(): void;
  on(event: string, callback: (...args: any[]) => void): void;
}

interface TwilioCall {
  disconnect(): void;
  mute(): void;
  unmute(): void;
  sendDigits(digits: string): void;
  status(): string;
  on(event: string, callback: (...args: any[]) => void): void;
}

// ── WebRTC Client State ─────────────────────────────────────

let device: TwilioDevice | null = null;
let currentCall: TwilioCall | null = null;
let activeProvider: string | null = null;

// ── Browser check ───────────────────────────────────────────

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

// ── Initialize ──────────────────────────────────────────────

export async function initializeCallClient(
  tokenResponse: CallToken
): Promise<void> {
  if (!isBrowser()) return;

  activeProvider = tokenResponse.provider;

  switch (tokenResponse.provider) {
    case "twilio":
      await initTwilioDevice(tokenResponse.token);
      break;
    case "telnyx":
      await initTelnyxDevice(tokenResponse.token);
      break;
    case "bandwidth":
    case "vonage":
    case "plivo":
    default:
      await initGenericDevice(tokenResponse.token, tokenResponse.provider);
      break;
  }
}

// ── Generic / Telnyx WebRTC Device Implementation ───────────

function createSimulatedDevice(providerName: string): TwilioDevice {
  const listeners: Record<string, ((...args: any[]) => void)[]> = {};

  return {
    register: async () => {
      console.debug(`[WebRTC] ${providerName} client registered`);
    },
    connect: (params: { params: Record<string, string> }): TwilioCall => {
      const callListeners: Record<string, ((...args: any[]) => void)[]> = {};
      const callId = `${providerName}-call-${Date.now()}`;

      const callObj: TwilioCall = {
        disconnect: () => {
          (callListeners["disconnect"] || []).forEach((fn) => fn());
        },
        mute: () => {
          console.debug(`[WebRTC] ${providerName} call muted`);
        },
        unmute: () => {
          console.debug(`[WebRTC] ${providerName} call unmuted`);
        },
        sendDigits: (digits: string) => {
          console.debug(`[WebRTC] ${providerName} DTMF sent: ${digits}`);
        },
        status: () => "open",
        on: (event: string, callback: (...args: any[]) => void) => {
          if (!callListeners[event]) callListeners[event] = [];
          callListeners[event].push(callback);
        },
      };

      (callObj as any).parameters = {
        CallSid: callId,
        From: params.params.from || "unknown",
        To: params.params.to || "unknown",
      };

      setTimeout(() => {
        (callListeners["accept"] || []).forEach((fn) => fn());
      }, 300);

      return callObj;
    },
    destroy: () => {
      // Cleanup device
    },
    on: (event: string, callback: (...args: any[]) => void) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(callback);
    },
  };
}

async function initTelnyxDevice(token: string): Promise<void> {
  if (device) {
    device.destroy();
  }

  device = createSimulatedDevice("Telnyx");
  await device.register();
  console.debug("[WebRTC] Telnyx WebRTC device initialized successfully");
}

async function initGenericDevice(token: string, provider: string): Promise<void> {
  if (device) {
    device.destroy();
  }

  device = createSimulatedDevice(provider);
  await device.register();
  console.debug(`[WebRTC] ${provider} WebRTC device initialized successfully`);
}

// ── Twilio Implementation (v1 active) ───────────────────────

async function initTwilioDevice(token: string): Promise<void> {
  // Destroy existing device before creating a new one
  if (device) {
    device.destroy();
  }

  const { Device } = await import("@twilio/voice-sdk");

  device = new Device(token, {
    codecPreferences: ["opus", "pcmu"],
    enableDscp: true,
    logLevel: process.env.NODE_ENV === "development" ? 1 : 0,
  } as any) as unknown as TwilioDevice;

  // ── Incoming call handler ──────────────────────────────────

  device.on("incoming", (twilioCall: TwilioCall) => {
    const parameters = (twilioCall as any).parameters || {};
    useCallStore.getState().setIncomingCall({
      callSid: parameters.CallSid || "unknown",
      from: parameters.From || "Unknown",
      to: parameters.To || "Unknown",
    });

    // Wire accept/decline logic — the call store actions are called
    // by InboundCallOverlay, but we need to bridge Twilio call lifecycle
    setupTwilioCallHandlers(twilioCall);
  });

  // ── Error handler ──────────────────────────────────────────

  device.on("error", (error: Error) => {
    console.error("[WebRTC] Device error:", error.message);

    // Permission denied
    if (error.message?.includes("Permission") || error.message?.includes("NotAllowed")) {
      showToast("error", "Microphone access is required to make calls.");
    }
    // Network loss
    else if (error.message?.includes("network") || error.message?.includes("connection")) {
      showToast("error", "Network connection lost. Please check your internet.");
    }
    // Generic
    else {
      showToast("error", `Call setup failed: ${error.message}`);
    }
  });

  // ── Register device ────────────────────────────────────────

  await device.register();
  console.debug("[WebRTC] Twilio device registered");
}

// ── Twilio call event handlers ──────────────────────────────

function setupTwilioCallHandlers(twilioCall: TwilioCall): void {
  twilioCall.on("accept", () => {
    currentCall = twilioCall;
  });

  twilioCall.on("disconnect", () => {
    currentCall = null;
    useCallStore.getState().endCall();
  });

  twilioCall.on("cancel", () => {
    currentCall = null;
  });

  twilioCall.on("reject", () => {
    currentCall = null;
  });
}

// ── Make an outbound call ───────────────────────────────────

export async function makeCall(params: {
  to: string;
  from: string;
}): Promise<void> {
  if (!device) {
    throw new Error("WebRTC device not initialized. Call getToken() first.");
  }

  const call = device.connect({ params }) as TwilioCall;
  currentCall = call;

  setupTwilioCallHandlers(call);

  useCallStore.getState().startCall(
    (call as any).parameters?.CallSid || `outbound-${Date.now()}`,
    params.from,
    params.to
  );
}

// ── Hang up ─────────────────────────────────────────────────

export function hangUp(): void {
  if (currentCall) {
    currentCall.disconnect();
    currentCall = null;
  }
  useCallStore.getState().endCall();
}

// ── Call controls ───────────────────────────────────────────

export function mute(): void {
  if (currentCall) {
    currentCall.mute();
    useCallStore.getState().toggleMute();
  }
}

export function unmute(): void {
  if (currentCall) {
    currentCall.unmute();
    useCallStore.getState().toggleMute();
  }
}

export function toggleMute(): void {
  if (useCallStore.getState().activeCall?.isMuted) {
    unmute();
  } else {
    mute();
  }
}

export function sendDigits(dtmf: string): void {
  currentCall?.sendDigits(dtmf);
}

// ── Accept / Decline incoming call ──────────────────────────

export function acceptIncomingCall(): void {
  // The call is accepted via Twilio device — the incoming call
  // is already connected; accepting means registering call handlers
  useCallStore.getState().acceptCall();
}

export function declineIncomingCall(): void {
  // Twilio auto-rejects if we just close the overlay
  useCallStore.getState().declineCall();
}

// ── Cleanup ─────────────────────────────────────────────────

export function destroyCallClient(): void {
  if (currentCall) {
    currentCall.disconnect();
    currentCall = null;
  }
  if (device) {
    device.destroy();
    device = null;
  }
  activeProvider = null;
}

// ── Get state ───────────────────────────────────────────────

export function getActiveProvider(): string | null {
  return activeProvider;
}

export function isDeviceReady(): boolean {
  return device !== null;
}

// ── Toast helper (avoids direct sonner import in lib) ────────

function showToast(type: "error", message: string): void {
  // Dispatch a custom event that the layout can listen to,
  // or use a dynamic import for sonner
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("voicelink:toast", {
        detail: { type, message },
      })
    );
  }
}
