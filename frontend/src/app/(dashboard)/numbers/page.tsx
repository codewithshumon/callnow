"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Phone,
  MessageSquare,
  Hash,
  ShieldCheck,
  Radio,
  Sparkles,
  Globe,
  Search,
  DollarSign,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { get, del } from "@/lib/api";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import AddNumberDialog from "./_components/AddNumberDialog";
import { cn } from "@/lib/utils";
import type { PhoneNumber } from "@/lib/types";

function formatPhone(num: string) {
  if (!num) return "";
  try {
    const parsed = parsePhoneNumberFromString(num);
    return parsed ? parsed.formatInternational() : num;
  } catch {
    return num;
  }
}

export default function NumbersPage() {
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCap, setFilterCap] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [releasing, setReleasing] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchNumbers = useCallback(async () => {
    try {
      const res = await get<PhoneNumber[]>("/numbers");
      setNumbers((res.data as any) || []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNumbers();
  }, [fetchNumbers]);

  async function handleRelease(id: string, num: string) {
    if (
      !confirm(
        `Are you sure you want to release ${num}? You will permanently lose inbound calls and SMS sent to this line.`
      )
    )
      return;
    setReleasing(id);
    try {
      await del(`/numbers/${id}`);
      setNumbers((prev) => prev.filter((n) => n.id !== id));
      toast.success(`Phone number ${num} released.`);
    } catch {
      toast.error("Failed to release number.");
    } finally {
      setReleasing(null);
    }
  }

  const copyNumber = (num: string, id: string) => {
    navigator.clipboard.writeText(num);
    setCopiedId(id);
    toast.success("Copied phone number");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = numbers.length;
    const active = numbers.filter((n) => n.status === "active").length;
    const voice = numbers.filter((n) => n.capabilities.voice).length;
    const sms = numbers.filter((n) => n.capabilities.sms).length;
    const monthlySpend = numbers.reduce(
      (acc, n) => acc + (Number(n.monthlyCost) || 0),
      0
    );
    return { total, active, voice, sms, monthlySpend };
  }, [numbers]);

  // Filtered Numbers
  const filtered = useMemo(() => {
    return numbers.filter((num) => {
      if (filterCap === "voice" && !num.capabilities.voice) return false;
      if (filterCap === "sms" && !num.capabilities.sms) return false;
      if (filterCap === "mms" && !num.capabilities.mms) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesNum = num.number?.toLowerCase().includes(q);
        const matchesName = num.friendlyName?.toLowerCase().includes(q);
        const matchesProvider = num.provider?.toLowerCase().includes(q);
        if (!matchesNum && !matchesName && !matchesProvider) return false;
      }
      return true;
    });
  }, [numbers, filterCap, search]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-w-0 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Virtual Phone Numbers
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage your carrier cloud numbers, voice lines, SMS routing, and caller ID credentials.
          </p>
        </div>

        <Button
          onClick={() => setShowAdd(true)}
          className="h-9 gap-1.5 text-xs shadow-xs bg-primary text-primary-foreground font-medium"
        >
          <Plus className="h-4 w-4" />
          <span>Provision New Number</span>
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-medium">
              Total Lines
            </span>
            <p className="text-2xl font-bold tracking-tight">{metrics.total}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {metrics.active} active in production
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-medium">
              Voice Enabled
            </span>
            <p className="text-2xl font-bold tracking-tight text-primary">
              {metrics.voice}
            </p>
            <p className="text-[11px] text-muted-foreground">Inbound & outbound calling</p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-medium">
              SMS Enabled
            </span>
            <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
              {metrics.sms}
            </p>
            <p className="text-[11px] text-muted-foreground">Direct carrier messaging</p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-medium">
              Monthly Telecom Spend
            </span>
            <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              ${metrics.monthlySpend.toFixed(2)}
            </p>
            <p className="text-[11px] text-muted-foreground">Billed monthly per DID</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search numbers, friendly labels, providers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["all", "voice", "sms", "mms"].map((cap) => (
            <Button
              key={cap}
              variant={filterCap === cap ? "default" : "outline"}
              size="xs"
              onClick={() => setFilterCap(cap)}
              className="rounded-full text-xs capitalize"
            >
              {cap === "all" ? "All Lines" : `${cap.toUpperCase()} Capable`}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border border-dashed border-border/80 bg-muted/20">
          <CardContent className="py-16 text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-muted/80 text-muted-foreground flex items-center justify-center mx-auto">
              <Hash className="h-7 w-7" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="font-semibold text-base">No phone numbers found</h3>
              <p className="text-xs text-muted-foreground">
                {search || filterCap !== "all"
                  ? "No virtual numbers match the active filter or search."
                  : "You don't have any provisioned numbers yet. Search and buy your first number."}
              </p>
            </div>
            <Button size="sm" onClick={() => setShowAdd(true)} className="text-xs gap-1.5 shadow-xs">
              <Plus className="h-4 w-4" /> Provision a Number
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((num) => {
            const isCopied = copiedId === num.id;
            const formatted = formatPhone(num.number);

            return (
              <Card
                key={num.id}
                className={cn(
                  "border border-border/80 bg-card hover:border-primary/40 hover:shadow-md transition-all rounded-2xl overflow-hidden group flex flex-col justify-between",
                  num.status !== "active" && "opacity-60"
                )}
              >
                <CardContent className="p-5 space-y-4">
                  {/* Top: Status, Friendly name, Number */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-lg font-bold text-foreground tracking-tight">
                          {formatted}
                        </p>
                        <button
                          onClick={() => copyNumber(num.number, num.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1"
                          title="Copy number"
                        >
                          {isCopied ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>

                      <p className="text-xs text-muted-foreground truncate mt-0.5 font-medium">
                        {num.friendlyName || "Primary Line"}
                      </p>
                    </div>

                    <Badge
                      variant={num.status === "active" ? "default" : "secondary"}
                      className={cn(
                        "text-[10px] uppercase font-semibold",
                        num.status === "active" &&
                          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      )}
                    >
                      {num.status}
                    </Badge>
                  </div>

                  {/* Capabilities Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] gap-1",
                        num.capabilities.voice
                          ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                          : "text-muted-foreground opacity-50"
                      )}
                    >
                      <Radio className="h-3 w-3" /> Voice {num.capabilities.voice ? "✓" : "✗"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] gap-1",
                        num.capabilities.sms
                          ? "border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5"
                          : "text-muted-foreground opacity-50"
                      )}
                    >
                      <MessageSquare className="h-3 w-3" /> SMS {num.capabilities.sms ? "✓" : "✗"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] gap-1",
                        num.capabilities.mms
                          ? "border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/5"
                          : "text-muted-foreground opacity-50"
                      )}
                    >
                      MMS {num.capabilities.mms ? "✓" : "✗"}
                    </Badge>
                  </div>

                  {/* Provider & Cost */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                    <span className="font-mono text-[11px] capitalize">
                      Carrier: <strong className="text-foreground">{num.provider}</strong>
                    </span>
                    <span className="font-mono font-medium text-foreground">
                      ${Number(num.monthlyCost || 1.15).toFixed(2)}/mo
                    </span>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                    <div className="flex items-center gap-1.5 flex-1">
                      {num.capabilities.voice && (
                        <Link
                          href={`/calls/dialpad?from=${encodeURIComponent(num.number)}`}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "text-xs gap-1.5 h-8 flex-1"
                          )}
                        >
                          <Phone className="h-3.5 w-3.5" /> Dial
                        </Link>
                      )}
                      {num.capabilities.sms && (
                        <Link
                          href={`/messages?from=${encodeURIComponent(num.number)}`}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "text-xs gap-1.5 h-8 flex-1"
                          )}
                        >
                          <MessageSquare className="h-3.5 w-3.5" /> SMS
                        </Link>
                      )}
                    </div>

                    {num.status === "active" && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRelease(num.id, num.number)}
                        disabled={releasing === num.id}
                        className="text-destructive hover:bg-destructive/10 h-8 w-8 shrink-0"
                        title="Release number"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Provision Number Dialog */}
      <AddNumberDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={() => {
          setShowAdd(false);
          fetchNumbers();
        }}
      />
    </div>
  );
}
