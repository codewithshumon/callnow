"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Voicemail,
  Play,
  Pause,
  Download,
  Phone,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Filter,
  Check,
  FileText,
  Volume2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { get, patch } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Voicemail as VoicemailType } from "@/lib/types";
import InlineAudioPlayer from "../calls/_components/InlineAudioPlayer";

export default function VoicemailsPage() {
  const [voicemails, setVoicemails] = useState<VoicemailType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchVoicemails = async () => {
    try {
      const res = await get<VoicemailType[]>("/voicemails");
      setVoicemails((res.data as any) || []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoicemails();
  }, []);

  async function markRead(id: string, isRead = true) {
    try {
      await patch(`/voicemails/${id}`, { isRead });
      setVoicemails((prev) =>
        prev.map((v) => (v.id === id ? { ...v, isRead } : v))
      );
    } catch {
      //
    }
  }

  // Aggregate metrics
  const metrics = useMemo(() => {
    const total = voicemails.length;
    const unread = voicemails.filter((v) => !v.isRead).length;
    const transcribed = voicemails.filter((v) => !!v.transcript).length;
    const totalDuration = voicemails.reduce(
      (acc, v) => acc + (v.durationSeconds || 0),
      0
    );
    return { total, unread, transcribed, totalDuration };
  }, [voicemails]);

  // Filtered list
  const filtered = useMemo(() => {
    return voicemails.filter((vm) => {
      if (filter === "unread" && vm.isRead) return false;
      if (filter === "transcribed" && !vm.transcript) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTranscript = vm.transcript?.toLowerCase().includes(q);
        const matchesId = vm.id?.toLowerCase().includes(q);
        if (!matchesTranscript && !matchesId) return false;
      }
      return true;
    });
  }, [voicemails, filter, search]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-w-0 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Voicemail Inbox
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Listen to recorded voice messages, read AI transcriptions, and manage customer callbacks.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchVoicemails}
          className="h-9 gap-1.5 text-xs shadow-2xs"
        >
          <span>Refresh Inbox</span>
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-medium">
              Total Messages
            </span>
            <p className="text-2xl font-bold tracking-tight">{metrics.total}</p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-medium">
              Unread / New
            </span>
            <p className="text-2xl font-bold tracking-tight text-primary">
              {metrics.unread}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-medium">
              AI Transcribed
            </span>
            <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {metrics.transcribed}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-medium">
              Total Audio Time
            </span>
            <p className="text-2xl font-bold tracking-tight font-mono">
              {metrics.totalDuration}s
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <Tabs value={filter} onValueChange={setFilter} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-3 sm:flex sm:h-9 bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="all" className="text-xs rounded-lg px-3">
              All ({metrics.total})
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs rounded-lg px-3">
              Unread ({metrics.unread})
            </TabsTrigger>
            <TabsTrigger value="transcribed" className="text-xs rounded-lg px-3">
              Transcribed ({metrics.transcribed})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search transcriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>
      </div>

      {/* Voicemail List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border border-dashed border-border/80 bg-muted/20">
          <CardContent className="py-16 text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-muted/80 text-muted-foreground flex items-center justify-center mx-auto">
              <Voicemail className="h-7 w-7" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="font-semibold text-base">No voicemails found</h3>
              <p className="text-xs text-muted-foreground">
                {search || filter !== "all"
                  ? "No voice messages match your current filter."
                  : "When unanswered callers leave audio messages, they will appear here with automated transcriptions."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((vm) => (
            <Card
              key={vm.id}
              className={cn(
                "border border-border/70 bg-card hover:border-primary/40 transition-all rounded-2xl overflow-hidden shadow-2xs",
                !vm.isRead && "border-primary/50 bg-primary/2"
              )}
            >
              <CardContent className="p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {!vm.isRead ? (
                      <Badge className="bg-primary text-primary-foreground text-[10px] uppercase font-bold">
                        New
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Read
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground font-mono">
                      {new Date(vm.createdAt).toLocaleString()}
                    </span>
                    <span>•</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      Duration: {vm.durationSeconds}s
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => markRead(vm.id, !vm.isRead)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      {vm.isRead ? "Mark as unread" : "Mark as read"}
                    </Button>
                  </div>
                </div>

                {/* Inline audio player */}
                {vm.recordingUrl && (
                  <div className="pt-1">
                    <InlineAudioPlayer src={vm.recordingUrl} />
                  </div>
                )}

                {/* Transcription */}
                {vm.transcript ? (
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 space-y-1">
                    <span className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> AI Transcription
                    </span>
                    <p className="text-xs text-foreground/90 leading-relaxed italic">
                      "{vm.transcript}"
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground/70 italic">
                    Transcription processing or audio not available.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
