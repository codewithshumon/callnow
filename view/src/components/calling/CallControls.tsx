import { Mic, MicOff, Pause, Play, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { isMuted: boolean; isOnHold: boolean; onToggleMute: () => void; onToggleHold: () => void; onHangup: () => void; }

export default function CallControls({ isMuted, isOnHold, onToggleMute, onToggleHold, onHangup }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={onToggleMute} className={isMuted ? "text-destructive" : ""} aria-label={isMuted ? "Unmute" : "Mute"}>
        {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </Button>
      <Button variant="ghost" size="icon" onClick={onToggleHold} aria-label={isOnHold ? "Resume" : "Hold"}>
        {isOnHold ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
      </Button>
      <Button variant="destructive" size="icon" onClick={onHangup} aria-label="Hang up">
        <PhoneOff className="h-4 w-4" />
      </Button>
    </div>
  );
}
