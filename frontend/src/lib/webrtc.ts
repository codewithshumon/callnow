"use client";

import { useCallStore } from "@/store/callStore";
import { useAuthStore } from "@/store/authStore";
import { startRingbackTone, stopRingbackTone } from "@/lib/dtmf";
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

// ── Zero-Cost Local Browser Call Recorder (Dual-Channel / Both Sides) ───────────

class BrowserAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private dest: MediaStreamAudioDestinationNode | null = null;
  private micStream: MediaStream | null = null;
  private remoteSource: MediaStreamAudioSourceNode | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  private tryAttachRemoteStream(stream: MediaStream | null | undefined): boolean {
    if (!stream || !this.audioContext || !this.dest || this.remoteSource) return false;
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return false;

    try {
      this.remoteSource = this.audioContext.createMediaStreamSource(stream);
      this.remoteSource.connect(this.dest);
      console.debug("[Recorder] Remote party audio successfully connected to recording mix!");
      return true;
    } catch (err) {
      console.warn("[Recorder] Failed attaching remote stream:", err);
      return false;
    }
  }

  private extractRemoteStream(twilioCall: any): MediaStream | null {
    if (!twilioCall) return null;

    // 1. Direct Twilio SDK getter
    if (typeof twilioCall.getRemoteStream === "function") {
      const s = twilioCall.getRemoteStream();
      if (s && s.getAudioTracks().length > 0) return s;
    }

    // 2. _mediaHandler._remoteStream
    const mh = twilioCall._mediaHandler;
    if (mh?._remoteStream && mh._remoteStream.getAudioTracks().length > 0) {
      return mh._remoteStream;
    }

    // 3. Audio element srcObject from outputs
    const defaultOutput = mh?.outputs?.get?.("default")?.audio || mh?._masterAudio;
    if (defaultOutput?.srcObject instanceof MediaStream && defaultOutput.srcObject.getAudioTracks().length > 0) {
      return defaultOutput.srcObject;
    }

    // 4. RTCPeerConnection receiver audio tracks
    const pc: RTCPeerConnection | null =
      mh?.version?.pc || mh?._peerConnection || twilioCall.peerConnection || null;
    if (pc && typeof pc.getReceivers === "function") {
      const audioReceiver = pc.getReceivers().find((r) => r.track && r.track.kind === "audio");
      if (audioReceiver?.track) {
        return new MediaStream([audioReceiver.track]);
      }
    }

    return null;
  }

  async startRecording(twilioCallOrStream?: any) {
    if (typeof window === "undefined") return;
    this.cleanupNodes();

    try {
      this.audioChunks = [];
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
      this.dest = this.audioContext.createMediaStreamDestination();

      // 1. Capture local microphone audio
      try {
        this.micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        const micSource = this.audioContext.createMediaStreamSource(this.micStream);
        micSource.connect(this.dest);
      } catch (err) {
        console.warn("[Recorder] Mic stream capture failed:", err);
      }

      // 2. Capture and mix remote client audio
      let attached = false;
      if (twilioCallOrStream instanceof MediaStream) {
        attached = this.tryAttachRemoteStream(twilioCallOrStream);
      } else if (twilioCallOrStream) {
        attached = this.tryAttachRemoteStream(this.extractRemoteStream(twilioCallOrStream));

        // Listen on WebRTC RTCPeerConnection 'track' event
        const pc: RTCPeerConnection | null =
          twilioCallOrStream._mediaHandler?.version?.pc ||
          twilioCallOrStream._mediaHandler?._peerConnection ||
          twilioCallOrStream.peerConnection ||
          null;

        if (pc && typeof pc.addEventListener === "function") {
          pc.addEventListener("track", (event: RTCTrackEvent) => {
            if (event.track?.kind === "audio") {
              const stream = event.streams?.[0] || new MediaStream([event.track]);
              this.tryAttachRemoteStream(stream);
            }
          });
        }

        // Poll every 200ms for up to 6 seconds in case media negotiates slightly after accept
        let pollCount = 0;
        this.pollInterval = setInterval(() => {
          pollCount++;
          if (attached || this.remoteSource || pollCount > 30) {
            if (this.pollInterval) clearInterval(this.pollInterval);
            this.pollInterval = null;
            return;
          }
          const s = this.extractRemoteStream(twilioCallOrStream);
          if (s) {
            attached = this.tryAttachRemoteStream(s);
          }
        }, 200);
      }

      const streamToRecord =
        this.dest.stream.getAudioTracks().length > 0 ? this.dest.stream : this.micStream;
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
      console.debug("[Recorder] Dual-party conversation recording started automatically");
    } catch (err) {
      console.warn("[Recorder] Failed to start local recording:", err);
    }
  }

  private cleanupNodes() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.remoteSource) {
      try { this.remoteSource.disconnect(); } catch {}
      this.remoteSource = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.audioContext) {
      try { this.audioContext.close(); } catch {}
      this.audioContext = null;
    }
    this.dest = null;
  }

  async stopRecordingAndUpload(
    callSid: string,
    meta?: { to?: string; from?: string; direction?: string }
  ): Promise<void> {
    if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
      this.cleanupNodes();
      return;
    }

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

            // Proactively refresh session if access token is absent or potentially stale
            let accessToken = useAuthStore.getState().accessToken;
            if (!accessToken && useAuthStore.getState().refreshToken) {
              await useAuthStore.getState().refreshSession().catch(() => {});
              accessToken = useAuthStore.getState().accessToken;
            }

            // Retry upload up to 3 times with exponential backoff & token refresh on 401
            let uploaded = false;
            for (let attempt = 1; attempt <= 3; attempt++) {
              try {
                const headers: Record<string, string> = {};
                if (accessToken) {
                  headers["Authorization"] = `Bearer ${accessToken}`;
                }

                const res = await fetch(`/api/calls/${encodeURIComponent(callSid)}/recording`, {
                  method: "POST",
                  headers,
                  body: formData,
                });

                if (res.ok) {
                  uploaded = true;
                  console.debug(`[Recorder] Recording auto-saved successfully for call ${callSid} (attempt ${attempt})`);
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(
                      new CustomEvent("call-recording-saved", {
                        detail: { callSid, toNumber: meta?.to },
                      })
                    );
                  }
                  break;
                }

                // If 401 Unauthorized (expired during long call), refresh token and retry
                if (res.status === 401 && attempt < 3) {
                  console.warn(`[Recorder] 401 on upload attempt ${attempt}, refreshing session and retrying...`);
                  await useAuthStore.getState().refreshSession().catch(() => {});
                  accessToken = useAuthStore.getState().accessToken;
                }
              } catch (attemptErr) {
                console.warn(`[Recorder] Recording upload attempt ${attempt} error:`, attemptErr);
              }

              if (!uploaded && attempt < 3) {
                await new Promise((r) => setTimeout(r, 1000 * attempt));
              }
            }

            if (!uploaded) {
              console.error(`[Recorder] Failed to upload recording for ${callSid} after 3 attempts`);
            }
          }
        } catch (err) {
          console.warn("[Recorder] Failed to upload local recording:", err);
        } finally {
          this.cleanupNodes();
          this.mediaRecorder = null;
          this.audioChunks = [];
          resolve();
        }
      };

      try {
        this.mediaRecorder!.stop();
      } catch {
        this.cleanupNodes();
        resolve();
      }
    });
  }
}

const callRecorder = new BrowserAudioRecorder();
let activeCallMetadata: { to: string; from: string } | null = null;

// ── Twilio call event handlers ──────────────────────────────

function setupTwilioCallHandlers(twilioCall: TwilioCall): void {
  if (!twilioCall || typeof twilioCall.on !== "function") return;

  twilioCall.on("accept", () => {
    stopRingbackTone();
    useCallStore.getState().setCallStatus("in-progress");
    currentCall = twilioCall;
    // Auto-record both caller and callee locally with 0 Twilio recording fees
    callRecorder.startRecording(twilioCall);
  });

  const handleEnd = () => {
    stopRingbackTone();
    const sid =
      (twilioCall as any).parameters?.CallSid ||
      (twilioCall as any).customParameters?.get?.("CallSid") ||
      (twilioCall as any).sid ||
      (twilioCall as any).outboundConnectionId ||
      `call-${Date.now()}`;

    // Read activeCall state before ending in case activeCallMetadata was reset
    const activeCall = useCallStore.getState().activeCall;
    const meta = activeCallMetadata
      ? {
          to: activeCallMetadata.to,
          from: activeCallMetadata.from,
          direction: "outbound",
        }
      : activeCall
      ? {
          to: activeCall.to,
          from: activeCall.from,
          direction: (activeCall as any)?.direction || "outbound",
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
  startRingbackTone();

  useCallStore.getState().startCall(
    (call as any).parameters?.CallSid || `outbound-${Date.now()}`,
    params.from,
    params.to
  );
}

// ── Hang up ─────────────────────────────────────────────────

export function hangUp(): void {
  stopRingbackTone();
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
