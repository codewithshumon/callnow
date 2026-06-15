"use client";

import { useCallStore } from "@/store/callStore";
import { makeCall as webrtcMakeCall, hangUp as webrtcHangUp, toggleMute as webrtcToggleMute } from "@/lib/webrtc";

export function useActiveCall() {
  const activeCall = useCallStore((s) => s.activeCall);
  const startCall = useCallStore((s) => s.startCall);
  const endCall = useCallStore((s) => s.endCall);
  const toggleMute = useCallStore((s) => s.toggleMute);
  const toggleHold = useCallStore((s) => s.toggleHold);
  const sendDigits = useCallStore((s) => s.sendDigits);

  return {
    activeCall,
    makeCall: async (params: { to: string; from: string }) => {
      await webrtcMakeCall(params);
      startCall("outbound", params.from, params.to);
    },
    hangUp: () => {
      webrtcHangUp();
      endCall();
    },
    toggleMute: () => {
      webrtcToggleMute();
      toggleMute();
    },
    toggleHold,
    sendDigits,
  };
}
