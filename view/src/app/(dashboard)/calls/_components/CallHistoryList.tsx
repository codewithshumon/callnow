"use client";

import { useEffect, useState, useCallback } from "react";
import { getPaginated } from "@/lib/api";
import { useCallStore } from "@/store/callStore";
import CallHistoryItem from "./CallHistoryItem";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import type { Call } from "@/lib/types";

export default function CallHistoryList() {
  const calls = useCallStore((s) => s.callHistory);
  const setCalls = useCallStore((s) => s.setCallHistory);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page: 1, limit: 20 };
      if (filter !== "all") params.direction = filter;
      const res = await getPaginated<Call>("/calls", params);
      setCalls(res.data);
    } catch { /* */ }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchCalls(); }, [fetchCalls]);

  const filtered = filter === "missed"
    ? calls.filter((c) => c.status === "no-answer")
    : filter === "inbound" || filter === "outbound"
      ? calls.filter((c) => c.direction === filter)
      : calls;

  return (
    <div>
      <Tabs value={filter} onValueChange={(v) => setFilter(v ?? "all")} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="inbound">Inbound</TabsTrigger>
          <TabsTrigger value="outbound">Outbound</TabsTrigger>
          <TabsTrigger value="missed">Missed</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading && <LoadingSkeleton variant="table" count={5} />}
      {!loading && filtered.length === 0 && (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No calls yet. Open the dial pad to make your first call.
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((call) => (
          <CallHistoryItem
            key={call.id}
            call={call}
            isExpanded={expandedId === call.id}
            onToggle={() => setExpandedId(expandedId === call.id ? null : call.id)}
          />
        ))}
      </div>
    </div>
  );
}
