"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Phone,
  ArrowUpRight,
  ArrowDownLeft,
  PhoneOff,
  PhoneCall,
  Clock,
  DollarSign,
  Download,
  RefreshCw,
  Search,
  Filter,
  FileAudio,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Activity,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getPaginated } from "@/lib/api";
import { useCallStore } from "@/store/callStore";
import CallHistoryItem from "./_components/CallHistoryItem";
import CallDetailSheet from "./_components/CallDetailSheet";
import DurationDisplay from "@/components/shared/DurationDisplay";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Call, Contact } from "@/lib/types";

export default function CallHistoryPage() {
  const calls = useCallStore((s) => s.callHistory);
  const setCalls = useCallStore((s) => s.setCallHistory);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filterTab, setFilterTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [page, setPage] = useState(1);
  const limit = 25;

  // Fetch calls and contacts
  const fetchCalls = useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      const params: Record<string, unknown> = { page: 1, limit: 100 };
      const [callsRes, contactsRes] = await Promise.allSettled([
        getPaginated<Call>("/calls", params),
        getPaginated<Contact>("/contacts", { limit: 100 }),
      ]);

      if (callsRes.status === "fulfilled") {
        setCalls(callsRes.value.data || []);
      }
      if (contactsRes.status === "fulfilled") {
        setContacts(contactsRes.value.data || []);
      }

      if (showToast) {
        toast.success("Call records refreshed");
      }
    } catch {
      toast.error("Failed to fetch call history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setCalls]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = calls.length;
    const inbound = calls.filter((c) => c.direction === "inbound").length;
    const outbound = calls.filter((c) => c.direction === "outbound").length;
    const completed = calls.filter((c) => c.status === "completed").length;
    const missed = calls.filter(
      (c) => c.status === "no-answer" || c.status === "busy" || c.status === "failed"
    ).length;
    const recordings = calls.filter((c) => !!c.recordingUrl).length;

    const totalDuration = calls.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);
    const avgDuration = total > 0 ? Math.round(totalDuration / total) : 0;
    const totalCost = calls.reduce((acc, c) => acc + Number(c.cost || 0), 0);
    const answerRate = total > 0 ? Math.round((completed / total) * 100) : 100;

    return {
      total,
      inbound,
      outbound,
      completed,
      missed,
      recordings,
      totalDuration,
      avgDuration,
      totalCost,
      answerRate,
    };
  }, [calls]);

  // Filtering Logic
  const filteredCalls = useMemo(() => {
    return calls.filter((call) => {
      // Tab filter
      if (filterTab === "inbound" && call.direction !== "inbound") return false;
      if (filterTab === "outbound" && call.direction !== "outbound") return false;
      if (
        filterTab === "missed" &&
        call.status !== "no-answer" &&
        call.status !== "busy" &&
        call.status !== "failed"
      ) {
        return false;
      }
      if (filterTab === "recordings" && !call.recordingUrl) return false;

      // Status dropdown filter
      if (statusFilter !== "all" && call.status !== statusFilter) return false;

      // Search query (from, to, provider, contact name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesFrom = call.fromNumber?.toLowerCase().includes(q);
        const matchesTo = call.toNumber?.toLowerCase().includes(q);
        const matchesSid = call.providerSid?.toLowerCase().includes(q);
        const contact = contacts.find((c) =>
          c.phones?.some(
            (p) =>
              p.number === call.fromNumber ||
              p.number === call.toNumber
          )
        );
        const matchesContact =
          contact &&
          contact.name?.toLowerCase().includes(q);

        if (!matchesFrom && !matchesTo && !matchesSid && !matchesContact) {
          return false;
        }
      }

      return true;
    });
  }, [calls, filterTab, statusFilter, searchQuery, contacts]);

  // Pagination slice
  const totalPages = Math.ceil(filteredCalls.length / limit) || 1;
  const paginatedCalls = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredCalls.slice(start, start + limit);
  }, [filteredCalls, page, limit]);

  // Export CSV Handler
  const handleExportCsv = () => {
    if (filteredCalls.length === 0) {
      toast.info("No call records to export");
      return;
    }

    const headers = [
      "ID",
      "Direction",
      "From",
      "To",
      "Status",
      "Duration (Seconds)",
      "Cost (USD)",
      "Started At",
      "Ended At",
      "Provider",
      "Provider SID",
      "Recording URL",
    ];

    const rows = filteredCalls.map((c) => [
      c.id,
      c.direction,
      c.fromNumber,
      c.toNumber,
      c.status,
      c.durationSeconds,
      c.cost || 0,
      c.startedAt,
      c.endedAt || "",
      c.provider || "",
      c.providerSid || "",
      c.recordingUrl || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `callnow-calls-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filteredCalls.length} call records`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-w-0 space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Call Logs & Analytics
            </h1>
            <Badge
              variant="outline"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
            >
              <Activity className="h-3 w-3 animate-pulse" /> Live CDR
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time telephony call detail records, voice recordings, and network performance.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCalls(true)}
            disabled={refreshing || loading}
            className="h-9 gap-1.5 text-xs shadow-2xs"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
            />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredCalls.length === 0}
            className="h-9 gap-1.5 text-xs shadow-2xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>

          <Link
            href="/calls/dialpad"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "h-9 gap-2 shadow-xs bg-primary text-primary-foreground font-medium"
            )}
          >
            <Phone className="h-4 w-4" />
            <span>Open Dialpad</span>
          </Link>
        </div>
      </div>

      {/* Top Executive KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Calls */}
        <Card className="border border-border/80 shadow-2xs bg-gradient-to-br from-card to-card/70">
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Calls
              </span>
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <PhoneCall className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight">
                {metrics.total}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <ArrowDownLeft className="h-3 w-3" /> {metrics.inbound} in
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                <ArrowUpRight className="h-3 w-3" /> {metrics.outbound} out
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Talk Time */}
        <Card className="border border-border/80 shadow-2xs bg-gradient-to-br from-card to-card/70">
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Talk Time
              </span>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 font-mono">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight">
                <DurationDisplay seconds={metrics.totalDuration} />
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
              <span>Avg per call:</span>
              <span className="font-mono font-medium text-foreground">
                <DurationDisplay seconds={metrics.avgDuration} />
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Answer / Connection Rate */}
        <Card className="border border-border/80 shadow-2xs bg-gradient-to-br from-card to-card/70">
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Answer Rate
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight">
                {metrics.answerRate}%
              </span>
              <span className="text-xs text-muted-foreground">
                ({metrics.completed} answered)
              </span>
            </div>
            {/* Visual mini progress bar */}
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${metrics.answerRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Missed & Failed */}
        <Card className="border border-border/80 shadow-2xs bg-gradient-to-br from-card to-card/70">
          <CardContent className="p-4 sm:p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Missed / Failed
              </span>
              <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                {metrics.missed}
              </span>
              <span className="text-xs text-muted-foreground">needs review</span>
            </div>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setFilterTab("missed")}
                className="text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
              >
                <span>Filter missed calls</span> →
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs, Search and Status selector toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
        <Tabs
          value={filterTab}
          onValueChange={(val) => {
            setFilterTab(val);
            setPage(1);
          }}
          className="w-full md:w-auto"
        >
          <TabsList className="grid grid-cols-5 sm:flex sm:h-9 bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="all" className="text-xs rounded-lg px-3">
              All ({metrics.total})
            </TabsTrigger>
            <TabsTrigger
              value="inbound"
              className="text-xs rounded-lg px-3 gap-1"
            >
              <ArrowDownLeft className="h-3 w-3 text-emerald-500 hidden sm:inline" />
              Inbound ({metrics.inbound})
            </TabsTrigger>
            <TabsTrigger
              value="outbound"
              className="text-xs rounded-lg px-3 gap-1"
            >
              <ArrowUpRight className="h-3 w-3 text-blue-500 hidden sm:inline" />
              Outbound ({metrics.outbound})
            </TabsTrigger>
            <TabsTrigger
              value="missed"
              className="text-xs rounded-lg px-3 gap-1 text-rose-500"
            >
              <PhoneOff className="h-3 w-3 hidden sm:inline" />
              Missed ({metrics.missed})
            </TabsTrigger>
            <TabsTrigger
              value="recordings"
              className="text-xs rounded-lg px-3 gap-1"
            >
              <FileAudio className="h-3 w-3 text-primary hidden sm:inline" />
              Recordings ({metrics.recordings})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 flex-1 md:max-w-md">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by number, contact, SID..."
              className="h-9 pl-9 text-xs rounded-xl border-border/80 bg-background"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status filter */}
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              if (val) {
                setStatusFilter(val);
                setPage(1);
              }
            }}
          >
            <SelectTrigger className="w-[130px] h-9 text-xs rounded-xl border-border/80">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="ringing">Ringing</SelectItem>
              <SelectItem value="no-answer">No Answer</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Call History List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredCalls.length === 0 ? (
          <Card className="border border-dashed border-border/80 bg-muted/20">
            <CardContent className="py-16 text-center space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-muted/80 text-muted-foreground flex items-center justify-center mx-auto">
                <Phone className="h-7 w-7 stroke-1" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="font-semibold text-base">No calls found</h3>
                <p className="text-xs text-muted-foreground">
                  {searchQuery || statusFilter !== "all" || filterTab !== "all"
                    ? "No calls match the current search or filter criteria. Try clearing filters."
                    : "No calls have been placed or received yet. Open the dialpad to place your first call."}
                </p>
              </div>

              {searchQuery || statusFilter !== "all" || filterTab !== "all" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterTab("all");
                    setStatusFilter("all");
                    setSearchQuery("");
                  }}
                  className="text-xs"
                >
                  Clear All Filters
                </Button>
              ) : (
                <Link
                  href="/calls/dialpad"
                  className={cn(
                    buttonVariants({ variant: "default", size: "sm" }),
                    "text-xs gap-1.5 shadow-xs"
                  )}
                >
                  <Phone className="h-3.5 w-3.5" /> Launch Dialpad
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          paginatedCalls.map((call) => (
            <CallHistoryItem
              key={call.id}
              call={call}
              contacts={contacts}
              onOpenDetails={(c) => setSelectedCall(c)}
            />
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {!loading && filteredCalls.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs text-muted-foreground">
          <div>
            Showing{" "}
            <span className="font-semibold text-foreground">
              {(page - 1) * limit + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-foreground">
              {Math.min(page * limit, filteredCalls.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">
              {filteredCalls.length}
            </span>{" "}
            records
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 w-8"
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 font-mono text-[11px]">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-8 w-8"
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Side Telemetry Sheet Drawer */}
      <CallDetailSheet
        call={selectedCall}
        open={!!selectedCall}
        onClose={() => setSelectedCall(null)}
      />
    </div>
  );
}
