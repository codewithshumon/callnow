"use client";

import { useEffect, useState } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { get, patch } from "@/lib/api";
import type { Voicemail } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function VoicemailsPage() {
  const [voicemails, setVoicemails] = useState<Voicemail[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    get<Voicemail[]>("/voicemails")
      .then((r) => setVoicemails((r.data as any) || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function markRead(id: string) {
    await patch(`/voicemails/${id}`, { isRead: true });
    setVoicemails((prev) => prev.map((v) => (v.id === id ? { ...v, isRead: true } : v)));
  }

  if (loading) return <div className="p-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Voicemails</h1>
      {voicemails.length === 0 && <p className="text-sm text-muted-foreground py-12 text-center">No voicemails.</p>}
      <div className="space-y-3">
        {voicemails.map((vm) => (
          <div key={vm.id} className={cn("flex items-start gap-4 rounded-lg border p-4", !vm.isRead && "border-primary/50 bg-primary/5")}>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => { setPlaying(playing === vm.id ? null : vm.id); markRead(vm.id); }}
            >
              {playing === vm.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {!vm.isRead && <Badge variant="default" className="text-[10px]">New</Badge>}
                <span className="text-xs text-muted-foreground">
                  {new Date(vm.createdAt).toLocaleString()} · {vm.durationSeconds}s
                </span>
              </div>
              {playing === vm.id && vm.recordingUrl && (
                <audio controls autoPlay src={vm.recordingUrl} className="mt-2 h-8 w-full" />
              )}
              {vm.transcript && <p className="mt-2 text-sm text-muted-foreground italic">&ldquo;{vm.transcript}&rdquo;</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
