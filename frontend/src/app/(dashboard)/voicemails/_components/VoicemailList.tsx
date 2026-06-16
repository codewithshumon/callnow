"use client";

import { useEffect, useState } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import { get, patch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Voicemail } from "@/lib/types";

export default function VoicemailList() {
  const [voicemails, setVoicemails] = useState<Voicemail[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    get<Voicemail[]>("/voicemails").then((r) => setVoicemails((r.data as any) || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handlePlay(id: string) {
    setPlayingId(playingId === id ? null : id);
    await patch(`/voicemails/${id}`, { isRead: true });
    setVoicemails((prev) => prev.map((v) => (v.id === id ? { ...v, isRead: true } : v)));
  }

  if (loading) return <LoadingSkeleton variant="card" count={3} />;
  if (voicemails.length === 0) return <p className="py-12 text-center text-sm text-muted-foreground">No voicemails.</p>;

  return (
    <div className="space-y-3">
      {voicemails.map((vm) => (
        <div key={vm.id} className={cn("flex items-start gap-4 rounded-lg border p-4", !vm.isRead && "border-primary/50 bg-primary/5")}>
          <Button variant="outline" size="icon" className="shrink-0" onClick={() => handlePlay(vm.id)}>
            {playingId === vm.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {!vm.isRead && <Badge className="text-[10px]">New</Badge>}
              <span className="text-xs text-muted-foreground">{new Date(vm.createdAt).toLocaleString()} · {vm.durationSeconds}s</span>
            </div>
            {playingId === vm.id && vm.recordingUrl && <audio controls autoPlay src={vm.recordingUrl} className="mt-2 h-8 w-full" />}
            {vm.transcript && <p className="mt-2 text-sm text-muted-foreground italic">&ldquo;{vm.transcript}&rdquo;</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
