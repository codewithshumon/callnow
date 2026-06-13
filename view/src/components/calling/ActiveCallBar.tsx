"use client";

import { useRouter } from "next/navigation";
import {
  PhoneOff,
  Mic,
  MicOff,
  Pause,
  Play,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallStore } from "@/store/callStore";
import { hangUp, toggleMute } from "@/lib/webrtc";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function ActiveCallBar() {
  const router = useRouter();
  const activeCall = useCallStore((s) => s.activeCall);
  const toggleHold = useCallStore((s) => s.toggleHold);
  const callToggleMute = useCallStore((s) => s.toggleMute);

  if (!activeCall) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-90 border-t bg-background px-4 py-2 shadow-lg lg:left-60">
      <div className="flex items-center gap-3">
        {/* Call info */}
        <button
          onClick={() => router.push("/calls")}
          className="flex flex-1 items-center gap-2 text-left min-w-0"
        >
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
          <span className="truncate text-sm font-medium">
            {activeCall.from} → {activeCall.to}
          </span>
          <span className="text-sm tabular-nums shrink-0 ml-auto">
            {formatDuration(activeCall.duration)}
          </span>
        </button>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              callToggleMute();
              toggleMute();
            }}
            className={activeCall.isMuted ? "text-destructive" : ""}
            aria-label={activeCall.isMuted ? "Unmute" : "Mute"}
          >
            {activeCall.isMuted ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleHold}
            aria-label={activeCall.isOnHold ? "Resume" : "Hold"}
          >
            {activeCall.isOnHold ? (
              <Play className="h-4 w-4" />
            ) : (
              <Pause className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/calls/dialpad")}
            aria-label="Open dial pad"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>

          <Button
            variant="destructive"
            size="icon"
            onClick={hangUp}
            aria-label="Hang up"
          >
            <PhoneOff className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {activeCall.isOnHold && (
        <p className="text-center text-xs text-yellow-500">On Hold</p>
      )}
    </div>
  );
}
