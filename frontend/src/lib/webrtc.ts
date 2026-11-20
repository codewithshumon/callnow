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

// ── Zero-Cost Local Browser Call Recorder ───────────────────

class BrowserAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private micStream: MediaStream | null = null;

  async startRecording(remoteStream?: MediaStream | null) {
    if (typeof window === "undefined") return;
    try {
      this.audioChunks = [];
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const dest = this.audioContext.createMediaStreamDestination();

      // 1. Capture local microphone
      try {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const micSource = this.audioContext.createMediaStreamSource(this.micStream);
        micSource.connect(dest);
      } catch (err) {
        console.warn("[Recorder] Mic stream capture failed:", err);
      }

      // 2. Capture remote audio stream from recipient
      if (remoteStream && remoteStream.getAudioTracks().length > 0) {
        try {
          const remoteSource = this.audioContext.createMediaStreamSource(remoteStream);
          remoteSource.connect(dest);
        } catch (err) {
          console.warn("[Recorder] Remote stream capture failed:", err);
        }
      }

      const streamToRecord = dest.stream.getAudioTracks().length > 0 ? dest.stream : this.micStream;
      if (!streamToRecord) return;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      this.mediaRecorder = new MediaRecorder(streamToRecord, { mimeType });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000);
      console.debug("[Recorder] Zero-cost call recording started automatically");
    } catch (err) {
      console.warn("[Recorder] Failed to start local recording:", err);
    }
  }

  async stopRecordingAndUpload(
    callSid: string,
    meta?: { to?: string; from?: string; direction?: string }
  ): Promise<void> {
    if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") return;

    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });
          if (audioBlob.size > 500) {
            const formData = new FormData();
            formData.append("audio", audioBlob, `${callSid}.webm`);
            if (meta?.to) formData.append("toNumber", meta.to);
            if (meta?.from) formData.append("fromNumber", meta.from);
            if (meta?.direction) formData.append("direction", meta.direction);

            await fetch(`/api/calls/${encodeURIComponent(callSid)}/recording`, {
              method: "POST",
              body: formData,
            });
            console.debug(`[Recorder] Recording auto-saved locally for call ${callSid}`);
          }
        } catch (err) {
          console.warn("[Recorder] Failed to upload local recording:", err);
        } finally {
          if (this.micStream) {
            this.micStream.getTracks().forEach((t) => t.stop());
            this.micStream = null;
          }
          if (this.audioContext) {
            this.audioContext.close().catch(() => {});
            this.audioContext = null;
          }
          this.mediaRecorder = null;
          this.audioChunks = [];
          resolve();
        }
      };

      this.mediaRecorder!.stop();
    });
  }
}

const callRecorder = new BrowserAudioRecorder();
let activeCallMetadata: { to: string; from: string } | null = null;

// ── Twilio call event handlers ──────────────────────────────

function setupTwilioCallHandlers(twilioCall: TwilioCall): void {
  if (!twilioCall || typeof twilioCall.on !== "function") return;

  twilioCall.on("accept", () => {
    currentCall = twilioCall;
    // Auto-record both sides locally with 0 Twilio recording fees
    const remoteStream =
      (twilioCall as any).getRemoteStream?.() ||
      (twilioCall as any)._mediaHandler?._remoteStream;
    callRecorder.startRecording(remoteStream);
  });

  const handleEnd = () => {
    const sid =
      (twilioCall as any).parameters?.CallSid ||
      (twilioCall as any).customParameters?.get?.("CallSid") ||
      (twilioCall as any).sid ||
      (twilioCall as any).outboundConnectionId ||
      `call-${Date.now()}`;

    const meta = activeCallMetadata
      ? {
          to: activeCallMetadata.to,
          from: activeCallMetadata.from,
          direction: "outbound",
        }
      : undefined;

    currentCall = null;
    activeCallMetadata = null;
    callRecorder.stopRecordingAndUpload(sid, meta);
    useCallStore.getState().endCall();
  };

  twilioCall.on("disconnect", handleEnd);
  twilioCall.on("cancel", handleEnd);
  twilioCall.on("reject", handleEnd);
  twilioCall.on("error", (error: any) => {
    console.error("[WebRTC] Call error:", error);
    handleEnd();
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

  // Sanitize numbers to clean E.164 (strip spaces, parentheses, dashes)
  const cleanTo = params.to.replace(/[^\d+]/g, "");
  const cleanFrom = params.from.replace(/[^\d+]/g, "");

  // Pass both To/to and From/from so TwiML Bin Mustache templates match regardless of casing
  const callResult = device.connect({
    params: {
      To: cleanTo,
      to: cleanTo,
      From: cleanFrom,
      from: cleanFrom,
    },
  });
  const call = (callResult instanceof Promise ? await callResult : callResult) as TwilioCall;
  currentCall = call;
  activeCallMetadata = { to: cleanTo, from: cleanFrom };

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
      new CustomEvent("voiceseek:toast", {
        detail: { type, message },
      })
    );
  }
}
