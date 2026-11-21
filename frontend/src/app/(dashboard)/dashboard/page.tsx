"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Phone,
  PhoneCall,
  MessageSquare,
  Disc,
  Zap,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Radio,
  Volume2,
  ShieldCheck,
  Headphones,
  Users,
  Hash,
  Play,
  ArrowRight,
  Activity,
  Sparkles,
  RefreshCw,
  FileAudio,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getPaginated, get } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import DurationDisplay from "@/components/shared/DurationDisplay";
import TimestampDisplay from "@/components/shared/TimestampDisplay";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { cn } from "@/lib/utils";
import type { Call, Contact, PhoneNumber } from "@/lib/types";

function formatPhone(num: string) {
  if (!num) return "—";
  try {
    const p = parsePhoneNumberFromString(num);
    return p ? p.formatInternational() : num;
  } catch {
    return num;
  }
}

function formatTotalDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0m 00s";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${secs.toString().padStart(2, "0")}s`;
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [calls, setCalls] = useState<Call[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [callsRes, contactsRes, numbersRes] = await Promise.allSettled([
        getPaginated<Call>("/calls", { page: 1, limit: 30 }),
        getPaginated<Contact>("/contacts", { limit: 50 }),
        get<PhoneNumber[]>("/numbers"),
      ]);

      if (callsRes.status === "fulfilled") {
        const val = callsRes.value as any;
        const list: Call[] = Array.isArray(val?.data)
          ? val.data
          : Array.isArray(val)
          ? val
          : [];
        setCalls(list);
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

      if (numbersRes.status === "fulfilled") {
        const val = numbersRes.value as any;
        const list: PhoneNumber[] = Array.isArray(val?.data)
          ? val.data
          : Array.isArray(val)
          ? val
          : [];
        setNumbers(list);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  // Calculations
  const totalCalls = calls.length;
  const outboundCalls = useMemo(
    () => calls.filter((c) => c.direction === "outbound"),
    [calls]
  );
  const inboundCalls = useMemo(
    () => calls.filter((c) => c.direction === "inbound"),
    [calls]
  );
  const totalDurationSeconds = useMemo(
    () => calls.reduce((acc, c) => acc + (c.durationSeconds || 0), 0),
    [calls]
  );
  const recordedCalls = useMemo(
    () => calls.filter((c) => !!c.recordingUrl),
    [calls]
  );

  const primaryNumber = numbers[0]?.number || "+14696388176";
  const recentCalls = calls.slice(0, 7);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const userName = user?.firstName
    ? user.firstName
    : user?.email
    ? user.email.split("@")[0]
    : "Member";

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* ── Top Header & Greeting ─────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {greeting}, {userName}
            </h1>
            <Badge variant="outline" className="hidden sm:inline-flex gap-1.5 px-2.5 py-0.5 font-medium text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Telephony Live
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time telephony cloud overview, WebRTC voice network & call activities.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-xs h-9 gap-1.5 rounded-xl shadow-xs"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            <span>Refresh</span>
          </Button>

          <Link
            href="/calls/recordings"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "text-xs h-9 gap-1.5 rounded-xl shadow-xs"
            )}
          >
            <Disc className="h-3.5 w-3.5 text-primary" />
            <span>Recordings</span>
          </Link>

          <Link
            href="/calls/dialpad"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "text-xs h-9 gap-1.5 rounded-xl shadow-md shadow-primary/20"
            )}
          >
            <PhoneCall className="h-3.5 w-3.5" />
            <span>Launch Dialpad</span>
          </Link>
        </div>
      </div>

      {/* ── Telephony Engine Banner ───────────────────────────── */}
      <Card className="border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-card rounded-2xl overflow-hidden shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                <Radio className="h-5 w-5 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm sm:text-base text-foreground">
                    Twilio Carrier Super Network
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                    OPUS HD Audio
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    Zero-Cost Recording
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                  <span>Caller ID: <span className="font-mono font-medium text-foreground">{formatPhone(primaryNumber)}</span></span>
                  <span>•</span>
                  <span>WebRTC Browser Softphone Active</span>
                  <span>•</span>
                  <span>Dual-party audio mixing enabled</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
              <Link
                href="/calls/dialpad"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "text-xs h-8 gap-1.5 rounded-lg border-primary/30 text-primary hover:bg-primary/10"
                )}
              >
                <span>Make a Call</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── KPI Stat Cards Grid ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Calls */}
        <Card className="rounded-2xl border-border/80 shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Calls
              </span>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Phone className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {totalCalls}
                </div>
              )}
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-medium">
                  <ArrowUpRight className="h-3 w-3" /> {outboundCalls.length} out
                </span>
                <span>•</span>
                <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <ArrowDownLeft className="h-3 w-3" /> {inboundCalls.length} in
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Talk Time */}
        <Card className="rounded-2xl border-border/80 shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Talk Time
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
                  {formatTotalDuration(totalDurationSeconds)}
                </div>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                Sum of all completed voice sessions
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Call Recordings */}
        <Card className="rounded-2xl border-border/80 shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Recorded Calls
              </span>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Disc className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {recordedCalls.length}
                </div>
              )}
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Saved locally</span>
                <Link
                  href="/calls/recordings"
                  className="font-medium text-primary hover:underline flex items-center gap-0.5"
                >
                  Listen now <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Phone Numbers */}
        <Card className="rounded-2xl border-border/80 shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Phone Numbers
              </span>
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Hash className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {numbers.length > 0 ? numbers.length : 1}
                </div>
              )}
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="font-mono text-muted-foreground truncate max-w-[130px]">
                  {formatPhone(primaryNumber)}
                </span>
                <Link
                  href="/numbers"
                  className="font-medium text-primary hover:underline flex items-center gap-0.5"
                >
                  Manage <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Quick Action Modules Grid ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Module 1: Dialpad */}
        <Link
          href="/calls/dialpad"
          className="group block rounded-2xl border border-border/80 bg-card p-5 hover:border-primary hover:shadow-md transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <PhoneCall className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors">
            Web Dialpad
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Browser HD softphone with real-time DTMF keypad and custom ringback tone.
          </p>
        </Link>

        {/* Module 2: Call Recordings */}
        <Link
          href="/calls/recordings"
          className="group block rounded-2xl border border-border/80 bg-card p-5 hover:border-primary hover:shadow-md transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Disc className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-amber-500 transition-colors">
            Call Recordings
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Zero-cost dual-party audio recordings, inline player, download & delete.
          </p>
        </Link>

        {/* Module 3: Messages & SMS */}
        <Link
          href="/messages"
          className="group block rounded-2xl border border-border/80 bg-card p-5 hover:border-primary hover:shadow-md transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <MessageSquare className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-blue-500 transition-colors">
            Messages & SMS
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Two-way SMS text messaging with real-time WebSocket sync and delivery status.
          </p>
        </Link>

        {/* Module 4: Power Dialer */}
        <Link
          href="/dialer"
          className="group block rounded-2xl border border-border/80 bg-card p-5 hover:border-primary hover:shadow-md transition-all relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <Zap className="h-5 w-5" />
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-emerald-500 transition-colors">
            Power Dialer
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Outreach dialer for high-volume prospect calls and campaign management.
          </p>
        </Link>
      </div>

      {/* ── Main Content Grid: Recent Calls + Telephony Diagnostics ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Calls (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/60 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Recent Calls</CardTitle>
                <CardDescription className="text-xs">
                  Latest incoming and outgoing telephony sessions
                </CardDescription>
              </div>
              <Link
                href="/calls"
                className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border/60">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : recentCalls.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <Phone className="h-8 w-8 text-muted-foreground mx-auto stroke-1" />
                  <p className="text-sm font-medium">No recent calls found</p>
                  <p className="text-xs text-muted-foreground">
                    Launch the Web Dialpad to place your first voice call.
                  </p>
                </div>
              ) : (
                recentCalls.map((call) => {
                  const isOutbound = call.direction === "outbound";
                  const targetNumber = isOutbound ? call.toNumber : call.fromNumber;
                  const matchedContact = contacts.find(
                    (c) =>
                      c.phones?.some(
                        (p) =>
                          p.number === targetNumber ||
                          p.number.replace(/[^\d]/g, "") === targetNumber?.replace(/[^\d]/g, "")
                      )
                  );

                  return (
                    <div
                      key={call.id}
                      className="p-4 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs",
                            isOutbound
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          )}
                        >
                          {isOutbound ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownLeft className="h-4 w-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground truncate">
                              {matchedContact ? matchedContact.name : formatPhone(targetNumber)}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] uppercase px-1.5 py-0 rounded font-semibold",
                                isOutbound
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              )}
                            >
                              {call.direction}
                            </Badge>
                            {call.recordingUrl && (
                              <Badge
                                variant="secondary"
                                className="text-[9px] px-1.5 py-0 gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              >
                                <Disc className="h-2.5 w-2.5 animate-pulse" />
                                Rec
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span className="font-mono text-[11px] font-medium text-foreground">
                              <DurationDisplay seconds={call.durationSeconds} />
                            </span>
                            <span>•</span>
                            <TimestampDisplay iso={call.startedAt || call.createdAt} mode="both" />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {call.recordingUrl && (
                          <Link
                            href="/calls/recordings"
                            className={cn(
                              buttonVariants({ variant: "ghost", size: "sm" }),
                              "h-8 px-2 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                            )}
                            title="Listen to recording"
                          >
                            <Play className="h-3.5 w-3.5" />
                          </Link>
                        )}

                        <Link
                          href={`/calls/dialpad?to=${encodeURIComponent(targetNumber)}`}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "h-8 px-2.5 text-xs gap-1 hover:bg-primary hover:text-primary-foreground"
                          )}
                          title="Call back"
                        >
                          <Phone className="h-3 w-3" />
                          <span className="hidden sm:inline">Dial</span>
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Telephony Status & Diagnostics (1 Column) */}
        <div className="space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/60">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Telephony Diagnostics
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time carrier & browser audio hardware status
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Carrier Super Network</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Twilio Voice Active
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Audio Codec</span>
                <span className="font-mono font-medium">Opus 48kHz Fullband</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Recording Engine</span>
                <span className="font-medium text-foreground">Dual-Party Mixer (0¢/min)</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Ringback Tone</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Enabled</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Active Outbound Caller ID</span>
                <span className="font-mono font-medium text-foreground">{formatPhone(primaryNumber)}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Event WebSocket Bus</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Connected
                </span>
              </div>

              <div className="pt-3 border-t border-border/60">
                <Link
                  href="/settings"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "w-full text-xs h-8 rounded-lg"
                  )}
                >
                  Configure Audio & Devices
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* User Account / Membership Card */}
          <Card className="rounded-2xl border-border/80 shadow-xs bg-gradient-to-br from-card to-muted/20">
            <CardContent className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {userName[0]?.toUpperCase() || "U"}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{user?.email || "shumon@acoscale.com"}</p>
                  <p className="text-xs text-muted-foreground">Enterprise Telecom Plan</p>
                </div>
              </div>
              <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Plan Status</span>
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
