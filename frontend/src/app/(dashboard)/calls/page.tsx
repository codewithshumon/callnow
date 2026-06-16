"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Phone, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { get, getPaginated } from "@/lib/api";
import { useCallStore } from "@/store/callStore";
import type { Call } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "in-progress": "bg-blue-100 text-blue-700",
  ringing: "bg-blue-100 text-blue-700",
  initiated: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
  busy: "bg-orange-100 text-orange-700",
  "no-answer": "bg-gray-100 text-gray-700",
};

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function CallHistoryPage() {
  const calls = useCallStore((s) => s.callHistory);
  const setCalls = useCallStore((s) => s.setCallHistory);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page: 1, limit: 20 };
      if (filter !== "all") params.direction = filter;
      const res = await getPaginated<Call>("/calls", params);
      setCalls(res.data);
    } catch { /* empty */ }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchCalls(); }, [fetchCalls]);

  const filtered = filter === "missed"
    ? calls.filter((c) => c.status === "no-answer")
    : filter === "inbound" || filter === "outbound"
      ? calls.filter((c) => c.direction === filter)
      : calls;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Call History</h1>
        <Link href="/calls/dialpad" className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">
          <Phone className="h-4 w-4" /> Dial Pad
        </Link>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v ?? "all")} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="inbound">Inbound</TabsTrigger>
          <TabsTrigger value="outbound">Outbound</TabsTrigger>
          <TabsTrigger value="missed">Missed</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No calls yet. Open the dial pad to make your first call.
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((call) => {
          const isExpanded = expanded === call.id;
          const DirectionIcon = call.direction === "outbound" ? ArrowUpRight : ArrowDownLeft;
          return (
            <div key={call.id} className="rounded-lg border">
              <button
                onClick={() => setExpanded(isExpanded ? null : call.id)}
                className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <DirectionIcon className={cn("h-4 w-4 shrink-0", call.direction === "outbound" ? "text-blue-500" : "text-green-500")} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{call.toNumber || call.fromNumber}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded", statusColors[call.status])}>
                      {call.status}
                    </span>
                    <span>{formatDuration(call.durationSeconds)}</span>
                    <span>${call.cost}</span>
                    <span>{new Date(call.startedAt).toLocaleString()}</span>
                  </div>
                </div>
              </button>
              {isExpanded && (
                <div className="border-t px-4 py-3 text-sm space-y-1">
                  <p><strong>From:</strong> {call.fromNumber}</p>
                  <p><strong>To:</strong> {call.toNumber}</p>
                  <p><strong>Provider:</strong> {call.provider} ({call.providerSid})</p>
                  {call.recordingUrl && (
                    <div>
                      <strong>Recording:</strong>{" "}
                      <audio controls src={call.recordingUrl} className="mt-1 h-8" />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
