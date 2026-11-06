"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Play,
  Pause,
  Square,
  Download,
  Eye,
  Radio,
  Clock,
  PhoneCall,
  CheckCircle2,
  Users,
  Activity,
  Layers,
  ChevronRight,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getPaginated, post } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Campaign, CampaignStatus } from "@/lib/types";

const statusConfig: Record<
  CampaignStatus,
  { label: string; badge: string; dot: string }
> = {
  draft: {
    label: "Draft",
    badge: "border-border text-muted-foreground bg-muted/40",
    dot: "bg-muted-foreground",
  },
  running: {
    label: "Running",
    badge: "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    dot: "bg-emerald-500 animate-pulse",
  },
  paused: {
    label: "Paused",
    badge: "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10",
    dot: "bg-amber-500",
  },
  completed: {
    label: "Completed",
    badge: "border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10",
    dot: "bg-blue-500",
  },
  stopped: {
    label: "Stopped",
    badge: "border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10",
    dot: "bg-rose-500",
  },
};

export default function CampaignListPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchCampaigns() {
    setLoading(true);
    try {
      const res = await getPaginated<Campaign>("/campaigns");
      setCampaigns(res.data || []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function handleAction(id: string, action: string) {
    try {
      await post(`/campaigns/${id}/${action}`);
      toast.success(`Campaign ${action}ed`);
      fetchCampaigns();
    } catch {
      toast.error(`Failed to ${action} campaign`);
    }
  }

  // Aggregate stats
  const stats = useMemo(() => {
    const total = campaigns.length;
    const running = campaigns.filter((c) => c.status === "running").length;
    const totalContacts = campaigns.reduce((acc, c) => acc + (c.totalContacts || 0), 0);
    const dialed = campaigns.reduce((acc, c) => acc + (c.dialed || 0), 0);
    const answered = campaigns.reduce((acc, c) => acc + (c.answered || 0), 0);
    const answerRate = dialed > 0 ? Math.round((answered / dialed) * 100) : 0;
    return { total, running, totalContacts, dialed, answered, answerRate };
  }, [campaigns]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 w-full min-w-0 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-w-0 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Automated Power Dialer
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            High-velocity outbound calling campaigns, lead management, and live call analytics.
          </p>
        </div>

        <Link
          href="/dialer/new"
          className={cn(
            buttonVariants({ variant: "default", size: "sm" }),
            "h-9 gap-1.5 text-xs shadow-xs bg-primary text-primary-foreground font-medium"
          )}
        >
          <Plus className="h-4 w-4" />
          <span>New Outbound Campaign</span>
        </Link>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-medium">
              Total Campaigns
            </span>
            <p className="text-2xl font-bold tracking-tight">{stats.total}</p>
            <p className="text-[11px] text-muted-foreground">Across all stages</p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-medium">
              Active Running
            </span>
            <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {stats.running}
            </p>
            <p className="text-[11px] text-emerald-600/80 font-medium">
              Currently dialing leads
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-medium">
              Leads Reached
            </span>
            <p className="text-2xl font-bold tracking-tight text-primary">
              {stats.dialed} / {stats.totalContacts}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Total contacts processed
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-medium">
              Connection Rate
            </span>
            <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
              {stats.answerRate}%
            </p>
            <p className="text-[11px] text-muted-foreground">
              {stats.answered} answered calls
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign List */}
      {campaigns.length === 0 ? (
        <Card className="border border-dashed border-border/80 bg-muted/20">
          <CardContent className="py-16 text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-muted/80 text-muted-foreground flex items-center justify-center mx-auto">
              <PhoneCall className="h-7 w-7" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="font-semibold text-base">No campaigns found</h3>
              <p className="text-xs text-muted-foreground">
                Launch a targeted calling campaign by uploading a CSV lead list and configuring concurrency.
              </p>
            </div>
            <Link
              href="/dialer/new"
              className={cn(buttonVariants({ variant: "default", size: "sm" }), "text-xs gap-1.5 shadow-xs")}
            >
              <Plus className="h-4 w-4" /> Create Your First Campaign
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => {
            const pct =
              c.totalContacts > 0 ? Math.round((c.dialed / c.totalContacts) * 100) : 0;
            const config = statusConfig[c.status] || statusConfig.draft;

            return (
              <Card
                key={c.id}
                className="border border-border/80 bg-card hover:border-primary/40 hover:shadow-sm transition-all rounded-2xl overflow-hidden"
              >
                <CardContent className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-bold text-lg text-foreground tracking-tight truncate">
                          {c.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] font-medium gap-1.5 py-0.5", config.badge)}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
                          {config.label}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                        <span className="font-mono">
                          Caller ID: {c.fromNumber || "Default Line"}
                        </span>
                        <span>•</span>
                        <span>Concurrency: {c.concurrency || 3} channels</span>
                        {c.startedAt && (
                          <>
                            <span>•</span>
                            <span>Started: {new Date(c.startedAt).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {c.status === "draft" && (
                        <Button
                          size="sm"
                          onClick={() => handleAction(c.id, "start")}
                          className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Play className="h-3.5 w-3.5" /> Start Campaign
                        </Button>
                      )}

                      {c.status === "running" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(c.id, "pause")}
                            className="h-8 text-xs gap-1.5"
                          >
                            <Pause className="h-3.5 w-3.5" /> Pause
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleAction(c.id, "stop")}
                            className="h-8 text-xs gap-1.5"
                          >
                            <Square className="h-3.5 w-3.5" /> Stop
                          </Button>
                        </>
                      )}

                      {c.status === "paused" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAction(c.id, "resume")}
                            className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Play className="h-3.5 w-3.5" /> Resume
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleAction(c.id, "stop")}
                            className="h-8 text-xs gap-1.5"
                          >
                            <Square className="h-3.5 w-3.5" /> Stop
                          </Button>
                        </>
                      )}

                      <Link
                        href={`/dialer/${c.id}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "h-8 text-xs gap-1.5"
                        )}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Live Dashboard</span>
                      </Link>
                    </div>
                  </div>

                  {/* Progress bar and metrics */}
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                      <span>Progress: {pct}%</span>
                      <span>
                        {c.dialed} / {c.totalContacts} Contacts Processed
                      </span>
                    </div>
                    <Progress value={pct} className="h-2 rounded-full" />
                  </div>

                  {/* Micro stats banner */}
                  <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                    <div className="bg-muted/30 rounded-xl p-2 border border-border/40">
                      <span className="text-[10px] text-muted-foreground uppercase">Answered</span>
                      <p className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {c.answered}
                      </p>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-2 border border-border/40">
                      <span className="text-[10px] text-muted-foreground uppercase">Failed</span>
                      <p className="font-mono text-sm font-bold text-rose-600 dark:text-rose-400">
                        {c.failed}
                      </p>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-2 border border-border/40">
                      <span className="text-[10px] text-muted-foreground uppercase">Remaining</span>
                      <p className="font-mono text-sm font-bold text-foreground">
                        {c.remaining}
                      </p>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-2 border border-border/40">
                      <span className="text-[10px] text-muted-foreground uppercase">Success</span>
                      <p className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                        {c.dialed > 0 ? Math.round((c.answered / c.dialed) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
