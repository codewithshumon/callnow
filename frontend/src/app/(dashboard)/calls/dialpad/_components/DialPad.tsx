"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Phone,
  PhoneOff,
  PhoneIncoming,
  PhoneOutgoing,
  Delete,
  Volume2,
  VolumeX,
  History,
  Users,
  Search,
  Sparkles,
  ArrowLeft,
  Mic,
  MicOff,
  Pause,
  Play,
  Grid,
  Radio,
  Clock,
  ExternalLink,
  ChevronRight,
  ClipboardPaste,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { get, getPaginated } from "@/lib/api";
import { initializeCallClient, makeCall, hangUp, toggleMute, sendDigits as sendWebRtcDigits } from "@/lib/webrtc";
import { useCallStore } from "@/store/callStore";
import { playDtmfTone } from "@/lib/dtmf";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CallToken, PhoneNumber, Call, Contact } from "@/lib/types";

const KEYPAD_BUTTONS = [
  { digit: "1", sub: "" },
  { digit: "2", sub: "ABC" },
  { digit: "3", sub: "DEF" },
  { digit: "4", sub: "GHI" },
  { digit: "5", sub: "JKL" },
  { digit: "6", sub: "MNO" },
  { digit: "7", sub: "PQRS" },
  { digit: "8", sub: "TUV" },
  { digit: "9", sub: "WXYZ" },
  { digit: "*", sub: "" },
  { digit: "0", sub: "+" },
  { digit: "#", sub: "" },
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function DialPad() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillTo = searchParams.get("to") || "";

  // Call store state
  const activeCall = useCallStore((s) => s.activeCall);
  const isMuted = activeCall?.isMuted ?? false;
  const isOnHold = activeCall?.isOnHold ?? false;
  const toggleHold = useCallStore((s) => s.toggleHold);
  const callToggleMute = useCallStore((s) => s.toggleMute);

  // Local state
  const [number, setNumber] = useState(prefillTo);
  const [fromNumber, setFromNumber] = useState("");
  const [userNumbers, setUserNumbers] = useState<PhoneNumber[]>([]);
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [activeTab, setActiveTab] = useState<"recents" | "contacts">("recents");
  const [calling, setCalling] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showInCallKeypad, setShowInCallKeypad] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync prefill from URL
  useEffect(() => {
    if (prefillTo) {
      setNumber(prefillTo);
    }
  }, [prefillTo]);

  // Load numbers, calls, contacts
  useEffect(() => {
    get<PhoneNumber[]>("/numbers")
      .then((r) => {
        const raw = r.data || (r as any);
        const list: PhoneNumber[] = Array.isArray(raw) ? raw : [];
        setUserNumbers(list);
        const voice = list.find(
          (n: PhoneNumber) =>
            (n.capabilities?.voice ?? true) && n.status === "active"
        );
        if (voice) setFromNumber(voice.number);
      })
      .catch(() => {});

    getPaginated<Call>("/calls", { limit: 10 })
      .then((r) => setRecentCalls(r.data || []))
      .catch(() => {});

    getPaginated<Contact>("/contacts", { limit: 50 })
      .then((r) => setContacts(r.data || []))
      .catch(() => {});
  }, []);

  const voiceNumbers = useMemo(
    () =>
      userNumbers.filter(
        (n) => (n.capabilities?.voice ?? true) && n.status === "active"
      ),
    [userNumbers]
  );

  // Keep fromNumber automatically selected when lines are available
  useEffect(() => {
    if (voiceNumbers.length > 0 && (!fromNumber || !voiceNumbers.some((n) => n.number === fromNumber))) {
      setFromNumber(voiceNumbers[0].number);
    }
  }, [voiceNumbers, fromNumber]);

  // Keypad audio & digit appending
  const handleDigitPress = useCallback(
    (digit: string) => {
      if (soundEnabled) {
        playDtmfTone(digit);
      }
      if (activeCall) {
        sendWebRtcDigits(digit);
        toast.info(`Sent DTMF: ${digit}`, { duration: 1000 });
      } else {
        setNumber((prev) => prev + digit);
      }
    },
    [soundEnabled, activeCall]
  );

  const backspace = useCallback(() => {
    setNumber((prev) => prev.slice(0, -1));
  }, []);

  const clearNumber = useCallback(() => {
    setNumber("");
  }, []);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const sanitized = text.replace(/[^0-9+*#]/g, "");
      if (sanitized) {
        setNumber(sanitized);
        toast.success("Number pasted");
      }
    } catch {
      toast.error("Failed to read clipboard");
    }
  }, []);

  // Initiate call
  const handleCall = useCallback(async () => {
    if (!number || number.length < 3) {
      toast.error("Please enter a valid phone number");
      return;
    }
    if (!fromNumber) {
      toast.error("Please select a caller ID to call from");
      return;
    }
    setCalling(true);
    try {
      const res = await get<CallToken>("/calls/token");
      await initializeCallClient(res.data);
      await makeCall({ to: number, from: fromNumber });
      toast.success(`Calling ${number}...`);
    } catch (err: any) {
      toast.error(err?.message || "Could not initiate call. Check Twilio settings.");
    } finally {
      setCalling(false);
    }
  }, [number, fromNumber]);

  // Physical keyboard listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if user is typing in a search bar or other input
      const target = e.target as HTMLElement;
      if (target && target.tagName === "INPUT" && target !== inputRef.current) {
        return;
      }

      if (/^[0-9*#]$/.test(e.key)) {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === "+") {
        e.preventDefault();
        setNumber((prev) => (prev.includes("+") ? prev : "+" + prev));
      } else if (e.key === "Backspace") {
        if (target !== inputRef.current) {
          e.preventDefault();
          backspace();
        }
      } else if (e.key === "Enter" && !activeCall) {
        e.preventDefault();
        handleCall();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDigitPress, backspace, handleCall, activeCall]);

  // Filtered contacts & recents for quick dial
  const filteredRecents = useMemo(() => {
    if (!searchFilter.trim()) return recentCalls;
    const q = searchFilter.toLowerCase();
    return recentCalls.filter(
      (c) =>
        c.toNumber?.toLowerCase().includes(q) ||
        c.fromNumber?.toLowerCase().includes(q)
    );
  }, [recentCalls, searchFilter]);

  const filteredContacts = useMemo(() => {
    if (!searchFilter.trim()) return contacts;
    const q = searchFilter.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.phones?.some((p) => p.number.includes(q))
    );
  }, [contacts, searchFilter]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-w-0 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link
              href="/calls"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Call History
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Dialpad</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            Phone Dialpad
            {activeCall && (
              <Badge variant="outline" className="animate-pulse border-green-500 text-green-500 gap-1.5 py-0.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Live Call
              </Badge>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-xs gap-1.5"
            title={soundEnabled ? "Mute DTMF sound" : "Enable DTMF sound"}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="h-4 w-4 text-primary" /> Sound ON
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 text-muted-foreground" /> Sound OFF
              </>
            )}
          </Button>

          <Link
            href="/calls"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs")}
          >
            <History className="h-4 w-4 mr-1.5" /> Call Logs
          </Link>
        </div>
      </div>

      {/* Main Grid: Dial terminal & Quick dial directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Phone Terminal */}
        <div className="lg:col-span-6 xl:col-span-5 flex justify-center">
          <Card className="w-full max-w-md shadow-xl border border-border/80 bg-gradient-to-b from-card to-card/90 overflow-hidden backdrop-blur">
            <CardContent className="p-6 space-y-5">
              {/* Caller ID selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Radio className="h-3.5 w-3.5 text-primary" /> Caller ID (From)
                  </label>
                  {voiceNumbers.length > 0 && (
                    <span className="text-[11px] text-muted-foreground">
                      {voiceNumbers.length} active line{voiceNumbers.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {voiceNumbers.length === 0 ? (
                  <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-700 dark:text-yellow-400 flex items-center justify-between">
                    <span>No active voice numbers found</span>
                    <Link href="/numbers" className="font-semibold underline ml-2">
                      Get Number
                    </Link>
                  </div>
                ) : (
                  <Select value={fromNumber} onValueChange={(v) => setFromNumber(v ?? "")}>
                    <SelectTrigger className="w-full h-10 font-mono text-xs sm:text-sm bg-muted/40">
                      <SelectValue placeholder="Select line to call from" />
                    </SelectTrigger>
                    <SelectContent>
                      {voiceNumbers.map((n) => (
                        <SelectItem key={n.id} value={n.number} className="text-xs sm:text-sm font-mono">
                          {n.number} {n.friendlyName ? `— ${n.friendlyName}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* In-Call Active Display or Standard Display */}
              {activeCall ? (
                <div className="rounded-2xl border border-green-500/30 bg-gradient-to-b from-green-500/10 via-card to-card p-5 text-center space-y-4 shadow-inner">
                  <div className="inline-flex items-center justify-center p-3 rounded-full bg-green-500/20 text-green-500 ring-8 ring-green-500/10 animate-pulse">
                    <Phone className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-mono font-bold tracking-tight">
                      {activeCall.to}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      From: {activeCall.from}
                    </p>
                    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-muted text-xs font-mono font-medium">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      {formatDuration(activeCall.duration)}
                      <span className="text-muted-foreground capitalize">({activeCall.status})</span>
                    </div>
                  </div>

                  {/* Call Action Bar in Call */}
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <Button
                      variant={isMuted ? "destructive" : "outline"}
                      size="icon"
                      onClick={() => {
                        callToggleMute();
                        toggleMute();
                      }}
                      className="h-12 w-12 rounded-full"
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>

                    <Button
                      variant={isOnHold ? "secondary" : "outline"}
                      size="icon"
                      onClick={toggleHold}
                      className="h-12 w-12 rounded-full"
                      title={isOnHold ? "Resume call" : "Put on hold"}
                    >
                      {isOnHold ? <Play className="h-5 w-5 text-green-500" /> : <Pause className="h-5 w-5" />}
                    </Button>

                    <Button
                      variant={showInCallKeypad ? "default" : "outline"}
                      size="icon"
                      onClick={() => setShowInCallKeypad(!showInCallKeypad)}
                      className="h-12 w-12 rounded-full"
                      title="Keypad for DTMF"
                    >
                      <Grid className="h-5 w-5" />
                    </Button>

                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={hangUp}
                      className="h-14 w-14 rounded-full shadow-lg bg-red-600 hover:bg-red-700 active:scale-95 transition-transform"
                      title="End Call"
                    >
                      <PhoneOff className="h-6 w-6" />
                    </Button>
                  </div>

                  {isOnHold && (
                    <p className="text-xs font-medium text-amber-500 animate-pulse">
                      Call is currently on hold
                    </p>
                  )}
                </div>
              ) : (
                /* Dial Display Screen */
                <div className="relative rounded-2xl border-2 border-border/70 bg-muted/20 hover:border-primary/50 transition-colors p-4 text-center">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                      Destination Number
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handlePaste}
                        className="text-xs text-muted-foreground hover:text-foreground p-1 transition-colors flex items-center gap-1"
                        title="Paste from clipboard"
                      >
                        <ClipboardPaste className="h-3.5 w-3.5" /> Paste
                      </button>
                      {number && (
                        <button
                          type="button"
                          onClick={clearNumber}
                          className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    ref={inputRef}
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-transparent text-center text-2xl sm:text-3xl font-mono font-semibold tracking-wider outline-none text-foreground placeholder:text-muted-foreground/40"
                  />

                  {number && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded border">Enter ↵</kbd> to dial
                    </p>
                  )}
                </div>
              )}

              {/* Keypad Matrix (shown always when idle, or toggled in call) */}
              {(!activeCall || showInCallKeypad) && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {KEYPAD_BUTTONS.map(({ digit, sub }) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => handleDigitPress(digit)}
                        className={cn(
                          "group relative flex flex-col items-center justify-center h-16 rounded-2xl border border-border/80 bg-background/80 shadow-xs",
                          "hover:bg-accent hover:border-primary/40 hover:shadow-md active:scale-92 transition-all duration-150 cursor-pointer select-none"
                        )}
                      >
                        <span className="text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                          {digit}
                        </span>
                        {sub && (
                          <span className="text-[10px] font-mono tracking-widest text-muted-foreground -mt-1 group-hover:text-foreground">
                            {sub}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Action Bar (Backspace & Call) */}
                  {!activeCall && (
                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={backspace}
                        disabled={!number}
                        className="h-14 w-14 rounded-2xl shrink-0 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
                        title="Delete digit"
                      >
                        <Delete className="h-5 w-5" />
                      </Button>

                      {voiceNumbers.length === 0 ? (
                        <Link
                          href="/numbers"
                          className={cn(
                            "flex-1 h-14 rounded-2xl text-sm sm:text-base font-semibold text-white shadow-lg",
                            "bg-amber-600 hover:bg-amber-500 active:scale-98 transition-all duration-150",
                            "inline-flex items-center justify-center gap-2"
                          )}
                        >
                          <Phone className="h-5 w-5" />
                          Get a Number to Call
                        </Link>
                      ) : (
                        <Button
                          type="button"
                          onClick={handleCall}
                          disabled={calling || !number}
                          className={cn(
                            "flex-1 h-14 rounded-2xl text-base font-semibold text-white shadow-lg",
                            "bg-emerald-600 hover:bg-emerald-500 active:scale-98 transition-all duration-150",
                            "disabled:opacity-50 disabled:pointer-events-none"
                          )}
                        >
                          <Phone className="mr-2 h-5 w-5 animate-pulse" />
                          {calling ? "Connecting Line..." : "Start Call"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Quick Dial Directory (Recents & Contacts) */}
        <div className="lg:col-span-6 xl:col-span-7 space-y-4">
          <Card className="shadow-md border border-border/70 overflow-hidden">
            <div className="p-4 border-b bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => setActiveTab(v as "recents" | "contacts")}
                  className="w-full"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <TabsList className="grid grid-cols-2 w-full sm:w-60">
                      <TabsTrigger value="recents" className="text-xs gap-1.5">
                        <History className="h-3.5 w-3.5" /> Recent Calls
                      </TabsTrigger>
                      <TabsTrigger value="contacts" className="text-xs gap-1.5">
                        <Users className="h-3.5 w-3.5" /> Contacts
                      </TabsTrigger>
                    </TabsList>

                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder={activeTab === "recents" ? "Filter recents..." : "Search contacts..."}
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="pl-8 h-8 text-xs bg-background"
                      />
                    </div>
                  </div>
                </Tabs>
              </div>
            </div>

            <CardContent className="p-0">
              {activeTab === "recents" ? (
                <div className="divide-y divide-border/60 max-h-[500px] overflow-y-auto">
                  {filteredRecents.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      <History className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="font-medium text-foreground">No recent calls found</p>
                      <p className="text-xs mt-1">
                        Calls made and received will appear here for fast redialing.
                      </p>
                    </div>
                  ) : (
                    filteredRecents.map((c) => {
                      const dialNumber = c.direction === "outbound" ? c.toNumber : c.fromNumber;
                      const isOutbound = c.direction === "outbound";
                      const isMissed = c.status === "no-answer";

                      return (
                        <div
                          key={c.id}
                          className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                                isMissed
                                  ? "bg-red-500/10 text-red-500"
                                  : isOutbound
                                  ? "bg-blue-500/10 text-blue-500"
                                  : "bg-emerald-500/10 text-emerald-500"
                              )}
                            >
                              {isMissed ? (
                                <PhoneOff className="h-4 w-4" />
                              ) : isOutbound ? (
                                <PhoneOutgoing className="h-4 w-4" />
                              ) : (
                                <PhoneIncoming className="h-4 w-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate font-mono">
                                {dialNumber}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="capitalize">{c.direction}</span>
                                <span>•</span>
                                <span>{new Date(c.startedAt).toLocaleDateString()}</span>
                                {c.durationSeconds > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>{formatDuration(c.durationSeconds)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setNumber(dialNumber);
                                toast.info(`Loaded ${dialNumber} to dialpad`);
                              }}
                              className="text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1.5 h-8 px-2.5"
                            >
                              <Phone className="h-3.5 w-3.5" /> Dial
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="divide-y divide-border/60 max-h-[500px] overflow-y-auto">
                  {filteredContacts.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="font-medium text-foreground">No contacts found</p>
                      <p className="text-xs mt-1">
                        Add contacts in the Contacts tab to quickly dial them here.
                      </p>
                    </div>
                  ) : (
                    filteredContacts.map((contact) => {
                      const primaryPhone = contact.phones?.[0]?.number || "";
                      const initials = contact.name
                        ? contact.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()
                        : "C";

                      return (
                        <div
                          key={contact.id}
                          className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="h-9 w-9 shrink-0">
                              <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">
                                {contact.name}
                              </p>
                              <p className="text-xs font-mono text-muted-foreground truncate">
                                {primaryPhone || "No phone number"}
                              </p>
                            </div>
                          </div>

                          {primaryPhone && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setNumber(primaryPhone);
                                toast.info(`Loaded ${contact.name}'s number`);
                              }}
                              className="text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1.5 h-8 px-2.5"
                            >
                              <Phone className="h-3.5 w-3.5" /> Call
                            </Button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick tips card */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground space-y-1.5">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Pro-tips for Power Dialing
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Use your computer keyboard to type numbers directly and hit <kbd className="px-1 py-0.2 bg-muted rounded border">Enter</kbd> to call.</li>
              <li>Toggle DTMF sounds in the top right to hear authentic telephone tones.</li>
              <li>Click any contact or recent record on the right to load their number in 1-click.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
