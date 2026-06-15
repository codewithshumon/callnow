"use client";

import { useState } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { patch } from "@/lib/api";
import type { Voicemail } from "@/lib/types";

interface Props { voicemail: Voicemail; }

export default function VoicemailPlayer({ voicemail }: Props) {
  const [playing, setPlaying] = useState(false);

  function toggle() {
    setPlaying(!playing);
    if (!voicemail.isRead) patch(`/voicemails/${voicemail.id}`, { isRead: true });
  }

  return (
    <div className="flex items-start gap-3">
      <Button variant="outline" size="icon" className="shrink-0" onClick={toggle}>
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <div>
        {playing && voicemail.recordingUrl && <audio controls autoPlay src={voicemail.recordingUrl} className="h-8 w-full max-w-xs" />}
        {voicemail.transcript && <p className="mt-1 text-sm text-muted-foreground italic">&ldquo;{voicemail.transcript}&rdquo;</p>}
        <p className="text-xs text-muted-foreground mt-1">{new Date(voicemail.createdAt).toLocaleString()} · {voicemail.durationSeconds}s</p>
      </div>
    </div>
  );
}
