"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  FileAudio,
  Play,
  Pause,
  Download,
  Trash2,
  Search,
  Phone,
  PhoneOff,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  RefreshCw,
  MessageSquare,
  Sparkles,
  Volume2,
  VolumeX,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Filter,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getPaginated, del } from "@/lib/api";
import DurationDisplay from "@/components/shared/DurationDisplay";
import TimestampDisplay from "@/components/shared/TimestampDisplay";
import InlineAudioPlayer from "../_components/InlineAudioPlayer";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Call, Contact } from "@/lib/types";

function formatPhone(num: string) {
  if (!num) return "—";
  try {
    const p = parsePhoneNumberFromString(num);
    return p ? p.formatInternational() : num;
  } catch {
    return num;
  }
}

export default function CallRecordingsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [directionFilter, setDirectionFilter] = useState<"all" | "inbound" | "outbound">("all");
  const [callToDelete, setCallToDelete] = useState<Call | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch all calls and contacts
  const fetchRecordings = useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      const [callsRes, contactsRes] = await Promise.allSettled([
        getPaginated<Call>("/calls", { page: 1, limit: 50 }),
        getPaginated<Contact>("/contacts", { limit: 50 }),
      ]);

      if (callsRes.status === "fulfilled") {
        const val = callsRes.value as any;
        const allCalls: Call[] = Array.isArray(val?.data)
          ? val.data
          : Array.isArray(val)
          ? val
          : [];

        // Keep only calls that have a recording and are valid
        const recordedCalls = allCalls.filter(
          (c) =>
            !!c.recordingUrl &&
            c.toNumber !== "Outbound" &&
            c.fromNumber !== "Browser"
        );
        setCalls(recordedCalls);
      }

      if (contactsRes.status === "fulfilled") {
        const val = contactsRes.value as any;
        const list: Contact[] = Array.isArray(val?.data)
          ? val.data
          : Array.isArray(val)
          ? val
          : [];
        setContacts(list);
      }

      if (showToast) {
        toast.success("Call recordings refreshed");
      }
    } catch {
      toast.error("Failed to load call recordings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = calls.length;
    const inbound = calls.filter((c) => c.direction === "inbound").length;
    const outbound = calls.filter((c) => c.direction === "outbound").length;
    const totalSeconds = calls.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);
    return { total, inbound, outbound, totalSeconds };
  }, [calls]);

  // Search and Direction Filtering
  const filteredCalls = useMemo(() => {
    return calls.filter((call) => {
      // Direction filter
      if (directionFilter === "inbound" && call.direction !== "inbound") return false;
      if (directionFilter === "outbound" && call.direction !== "outbound") return false;

      // Number / Contact Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const numMatch =
          call.toNumber?.toLowerCase().includes(q) ||
          call.fromNumber?.toLowerCase().includes(q);
        const contact = contacts.find((c) =>
          c.phones?.some(
            (p) =>
              p.number.toLowerCase().includes(q) ||
              p.number.replace(/[^\d]/g, "").includes(q.replace(/[^\d]/g, ""))
          )
        );
        const contactMatch = contact && contact.name?.toLowerCase().includes(q);

        if (!numMatch && !contactMatch) return false;
      }

      return true;
    });
  }, [calls, directionFilter, searchQuery, contacts]);

  // Delete recording handler
  const handleDeleteRecording = async () => {
    if (!callToDelete) return;
    setDeleting(true);
    try {
      await del(`/calls/${callToDelete.id}/recording`);
      toast.success("Call recording permanently deleted");
      setCalls((prev) => prev.filter((c) => c.id !== callToDelete.id));
      setCallToDelete(null);
    } catch {
      toast.error("Failed to delete call recording");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-w-0 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link
              href="/calls"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Call History
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Recordings</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Call Recordings
            </h1>
            <Badge
              variant="outline"
              className="px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
            >
              <FileAudio className="h-3 w-3 mr-1" />
              {metrics.total} Recorded
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Listen to, search by phone number, download, or delete voice call recordings for all incoming and outgoing conversations.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRecordings(true)}
            disabled={refreshing || loading}
            className="h-9 gap-1.5 text-xs shadow-2xs"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            <span>Refresh</span>
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

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border border-border/80 shadow-2xs bg-gradient-to-br from-card to-card/70">
          <CardContent className="p-4 sm:p-5 space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">
                Total Recordings
              </span>
              <FileAudio className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight">
              {metrics.total}
            </p>
            <p className="text-[11px] text-muted-foreground">
              All stored audio files
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-2xs bg-gradient-to-br from-card to-card/70">
          <CardContent className="p-4 sm:p-5 space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">
                Outbound Calls
              </span>
              <ArrowUpRight className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
              {metrics.outbound}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Placed from browser dialpad
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-2xs bg-gradient-to-br from-card to-card/70">
          <CardContent className="p-4 sm:p-5 space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">
                Inbound Calls
              </span>
              <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {metrics.inbound}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Received customer calls
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-2xs bg-gradient-to-br from-card to-card/70">
          <CardContent className="p-4 sm:p-5 space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium uppercase tracking-wider">
                Total Audio Time
              </span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight font-mono">
              <DurationDisplay seconds={metrics.totalSeconds} />
            </p>
            <p className="text-[11px] text-muted-foreground">
              Cumulative playback duration
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar & Direction Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <Tabs
          value={directionFilter}
          onValueChange={(v) => setDirectionFilter(v as any)}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-3 sm:flex sm:h-9 bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="all" className="text-xs rounded-lg px-3">
              All ({metrics.total})
            </TabsTrigger>
            <TabsTrigger value="outbound" className="text-xs rounded-lg px-3 gap-1">
              <ArrowUpRight className="h-3 w-3 text-blue-500 hidden sm:inline" />
              Outbound ({metrics.outbound})
            </TabsTrigger>
            <TabsTrigger value="inbound" className="text-xs rounded-lg px-3 gap-1">
              <ArrowDownLeft className="h-3 w-3 text-emerald-500 hidden sm:inline" />
              Inbound ({metrics.inbound})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search by Number or Contact */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by phone number (e.g. +14074253553)..."
            className="h-9 pl-9 pr-8 text-xs rounded-xl border-border/80 bg-background"
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
      </div>

      {/* Main Recordings Cards Grid / List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredCalls.length === 0 ? (
          <Card className="border border-dashed border-border/80 bg-muted/20">
            <CardContent className="py-16 text-center space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-muted/80 text-muted-foreground flex items-center justify-center mx-auto">
                <FileAudio className="h-7 w-7 stroke-1" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="font-semibold text-base">No call recordings found</h3>
                <p className="text-xs text-muted-foreground">
                  {searchQuery || directionFilter !== "all"
                    ? "No recordings match your search or filter criteria. Try clearing search."
                    : "Zero-cost call recordings are automatically captured when you make or receive calls from the Web Dialpad."}
                </p>
              </div>

              {searchQuery || directionFilter !== "all" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setDirectionFilter("all");
                  }}
                  className="text-xs"
                >
                  Clear Filters
                </Button>
              ) : (
                <Link
                  href="/calls/dialpad"
                  className={cn(
                    buttonVariants({ variant: "default", size: "sm" }),
                    "text-xs gap-1.5 shadow-xs"
                  )}
                >
                  <Phone className="h-3.5 w-3.5" /> Make a Call to Record
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredCalls.map((call) => {
            const isOutbound = call.direction === "outbound";
            const targetNumber = isOutbound ? call.toNumber : call.fromNumber;
            const callerIdNumber = isOutbound ? call.fromNumber : call.toNumber;

            const matchedContact = contacts.find(
              (c) =>
                c.phones?.some(
                  (p) =>
                    p.number === targetNumber ||
                    p.number.replace(/[^\d]/g, "") === targetNumber.replace(/[^\d]/g, "")
                )
            );

            return (
              <Card
                key={call.id}
                className="border border-border/80 bg-card hover:border-primary/40 hover:shadow-sm transition-all rounded-2xl overflow-hidden"
              >
                <CardContent className="p-4 sm:p-5 space-y-3.5">
                  {/* Card Top Row: Contact / Number / Timing / Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "h-11 w-11 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm",
                          isOutbound
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        )}
                      >
                        {isOutbound ? (
                          <ArrowUpRight className="h-5 w-5" />
                        ) : (
                          <ArrowDownLeft className="h-5 w-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-base text-foreground truncate">
                            {matchedContact ? matchedContact.name : formatPhone(targetNumber)}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md",
                              isOutbound
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            )}
                          >
                            {call.direction}
                          </Badge>
                          {matchedContact && (
                            <span className="font-mono text-xs text-muted-foreground">
                              {formatPhone(targetNumber)}
                            </span>
                          )}
                        </div>

                        {/* Date, Time, Duration Row */}
                        <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                          <span className="flex items-center gap-1 font-mono text-[11px] font-medium text-foreground">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <DurationDisplay seconds={call.durationSeconds} />
                          </span>
                          <span>•</span>
                          <span className="font-mono text-[11px]">
                            {callerIdNumber && `Via: ${formatPhone(callerIdNumber)}`}
                          </span>
                          <span>•</span>
                          <TimestampDisplay iso={call.startedAt || call.createdAt} mode="both" />
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      <Link
                        href={`/calls/dialpad?to=${encodeURIComponent(targetNumber)}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "h-8 px-2.5 text-xs gap-1.5 hover:bg-primary hover:text-primary-foreground transition-all"
                        )}
                        title="Call number"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Call</span>
                      </Link>

                      <Link
                        href={`/messages?to=${encodeURIComponent(targetNumber)}`}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "sm" }),
                          "h-8 px-2.5 text-xs gap-1.5"
                        )}
                        title="Send SMS"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">SMS</span>
                      </Link>

                      {/* Delete Recording Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCallToDelete(call)}
                        className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
                        title="Delete recording"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  </div>

                  {/* Audio Player Card Section */}
                  {call.recordingUrl && (
                    <div className="pt-2 border-t border-border/50">
                      <InlineAudioPlayer src={call.recordingUrl} />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!callToDelete} onOpenChange={(open) => !open && setCallToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Call Recording?
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm pt-2">
              Are you sure you want to delete the audio recording for the call{" "}
              {callToDelete && (
                <span className="font-semibold text-foreground font-mono">
                  {callToDelete.direction === "outbound"
                    ? callToDelete.toNumber
                    : callToDelete.fromNumber}
                </span>
              )}
              ? This will permanently delete the audio recording file from the server. The call detail record will be kept for billing and analytics history.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCallToDelete(null)}
              disabled={deleting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteRecording}
              disabled={deleting}
              className="text-xs gap-1.5"
            >
              {deleting ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span>{deleting ? "Deleting..." : "Permanently Delete"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
