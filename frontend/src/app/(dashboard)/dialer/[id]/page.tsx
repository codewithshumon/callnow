"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Pause,
  Square,
  Download,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  PhoneCall,
  PhoneForwarded,
  Sparkles,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { get, post } from "@/lib/api";
import { joinCampaignRoom, leaveCampaignRoom, onWsEvent } from "@/lib/websocket";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Campaign, CampaignContact, CampaignStatus } from "@/lib/types";
import type { WsCampaignProgressEvent, WsCampaignCompleteEvent } from "@/lib/types";

export default function CampaignLivePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCampaign = useCallback(async () => {
    if (!id) return;
    try {
      const res = await get<Campaign>(`/campaigns/${id}`);
      setCampaign(res.data as any);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  // WebSocket room for live progress
  useEffect(() => {
    if (!id) return;
    joinCampaignRoom(id);

    const unsubProgress = onWsEvent("campaign:progress", (data: WsCampaignProgressEvent["data"]) => {
      if (data.campaignId === id) {
        setCampaign((prev) =>
          prev
            ? {
                ...prev,
                dialed: data.dialed,
                answered: data.answered,
                failed: data.failed,
                remaining: data.remaining,
              }
            : prev
        );
      }
    });

    const unsubComplete = onWsEvent("campaign:complete", (data: WsCampaignCompleteEvent["data"]) => {
      if (data.campaignId === id) {
        fetchCampaign();
        toast.success("Campaign completed!");
      }
    });

    return () => {
      leaveCampaignRoom(id);
      unsubProgress();
      unsubComplete();
    };
  }, [id, fetchCampaign]);

  async function handleAction(action: string) {
    try {
      await post(`/campaigns/${id}/${action}`);
      toast.success(`Campaign ${action}ed`);
      fetchCampaign();
    } catch {
      toast.error(`Failed to ${action} campaign`);
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 w-full min-w-0 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-base font-semibold text-destructive">Campaign not found</p>
        <Link href="/dialer" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Return to Campaigns
        </Link>
      </div>
    );
  }

  const pct =
    campaign.totalContacts > 0 ? Math.round((campaign.dialed / campaign.totalContacts) * 100) : 0;
  const isRunning = campaign.status === "running";
  const isPaused = campaign.status === "paused";

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-w-0 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Link
            href="/dialer"
            className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "rounded-xl")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{campaign.name}</h1>
              <Badge
                variant="outline"
                className={cn(
                  "capitalize text-[10px] font-semibold gap-1.5",
                  isRunning
                    ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                    : "border-border text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isRunning ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                  )}
                />
                {campaign.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Caller ID: <span className="font-mono">{campaign.fromNumber || "Default"}</span> • Concurrency:{" "}
              {campaign.concurrency || 3} channels
            </p>
          </div>
        </div>

        {/* Campaign Action buttons */}
        <div className="flex items-center gap-2">
          {isRunning && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction("pause")}
                className="h-9 text-xs gap-1.5"
              >
                <Pause className="h-3.5 w-3.5" /> Pause
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleAction("stop")}
                className="h-9 text-xs gap-1.5"
              >
                <Square className="h-3.5 w-3.5" /> Stop
              </Button>
            </>
          )}

          {isPaused && (
            <>
              <Button
                size="sm"
                onClick={() => handleAction("resume")}
                className="h-9 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Play className="h-3.5 w-3.5" /> Resume
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleAction("stop")}
                className="h-9 text-xs gap-1.5"
              >
                <Square className="h-3.5 w-3.5" /> Stop
              </Button>
            </>
          )}

          {(campaign.status === "completed" || campaign.status === "stopped") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                window.open(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/campaigns/${id}/export`, "_blank")
              }
              className="h-9 text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5" /> Export CDR (.csv)
            </Button>
          )}
        </div>
      </div>

      {/* Real-time Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[
          { label: "Total Leads", value: campaign.totalContacts, color: "text-foreground" },
          { label: "Dialed", value: campaign.dialed, color: "text-primary" },
          { label: "Answered", value: campaign.answered, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Failed / Invalid", value: campaign.failed, color: "text-rose-600 dark:text-rose-400" },
          { label: "Remaining", value: campaign.remaining, color: "text-amber-600 dark:text-amber-400" },
          {
            label: "Answer Rate",
            value: `${campaign.dialed > 0 ? Math.round((campaign.answered / campaign.dialed) * 100) : 0}%`,
            color: "text-blue-600 dark:text-blue-400",
          },
        ].map((s) => (
          <Card key={s.label} className="border border-border/80 shadow-2xs">
            <CardContent className="p-4 text-center space-y-1">
              <span className="text-[11px] text-muted-foreground uppercase font-medium">
                {s.label}
              </span>
              <p className={cn("text-2xl sm:text-3xl font-bold font-mono", s.color)}>
                {s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress & Live Velocity Bar */}
      <Card className="border border-border/80 shadow-2xs bg-card">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
            <span className="flex items-center gap-1.5">
              <Activity className={cn("h-4 w-4", isRunning ? "text-emerald-500 animate-pulse" : "text-muted-foreground")} />
              Campaign Progress ({pct}%)
            </span>
            <span className="font-mono text-muted-foreground text-xs">
              {campaign.dialed} of {campaign.totalContacts} Contacts Finished
            </span>
          </div>

          <Progress value={pct} className="h-3 rounded-full" />

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <span>
              {campaign.startedAt ? `Started: ${new Date(campaign.startedAt).toLocaleString()}` : "Not started"}
            </span>
            <span>
              {campaign.completedAt && `Completed: ${new Date(campaign.completedAt).toLocaleString()}`}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
