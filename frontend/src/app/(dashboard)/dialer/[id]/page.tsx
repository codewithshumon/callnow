"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Play, Pause, Square, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { get, post } from "@/lib/api";
import { joinCampaignRoom, leaveCampaignRoom, onWsEvent } from "@/lib/websocket";
import { toast } from "sonner";
import type { Campaign, CampaignContact, CampaignStatus } from "@/lib/types";
import type { WsCampaignProgressEvent, WsCampaignCompleteEvent } from "@/lib/types";

export default function CampaignLivePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [contacts, setContacts] = useState<CampaignContact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaign = useCallback(async () => {
    if (!id) return;
    try {
      const res = await get<Campaign>(`/campaigns/${id}`);
      setCampaign(res.data as any);
    } catch { /* */ }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchCampaign(); }, [fetchCampaign]);

  // WebSocket room for live progress
  useEffect(() => {
    if (!id) return;
    joinCampaignRoom(id);

    const unsubProgress = onWsEvent("campaign:progress", (data: WsCampaignProgressEvent["data"]) => {
      if (data.campaignId === id) {
        setCampaign((prev) => prev ? { ...prev, dialed: data.dialed, answered: data.answered, failed: data.failed, remaining: data.remaining } : prev);
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
    } catch { toast.error(`Failed to ${action} campaign`); }
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
  if (!campaign) return <div className="p-6 text-sm text-destructive">Campaign not found.</div>;

  const pct = campaign.totalContacts > 0 ? Math.round((campaign.dialed / campaign.totalContacts) * 100) : 0;
  const isRunning = campaign.status === "running";
  const isPaused = campaign.status === "paused";

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dialer")}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-xl font-semibold flex-1">{campaign.name}</h1>
        <Badge>{campaign.status}</Badge>
        <div className="flex gap-2">
          {isRunning && <><Button size="sm" variant="outline" onClick={() => handleAction("pause")}><Pause className="h-3 w-3 mr-1" /> Pause</Button>
          <Button size="sm" variant="destructive" onClick={() => handleAction("stop")}><Square className="h-3 w-3 mr-1" /> Stop</Button></>}
          {isPaused && <><Button size="sm" variant="outline" onClick={() => handleAction("resume")}><Play className="h-3 w-3 mr-1" /> Resume</Button>
          <Button size="sm" variant="destructive" onClick={() => handleAction("stop")}><Square className="h-3 w-3 mr-1" /> Stop</Button></>}
          {(campaign.status === "completed" || campaign.status === "stopped") && (
            <Button size="sm" variant="outline" onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/campaigns/${id}/export`, "_blank")}>
              <Download className="h-3 w-3 mr-1" /> Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {[{ label: "Total", value: campaign.totalContacts },
          { label: "Dialed", value: campaign.dialed },
          { label: "Answered", value: campaign.answered },
          { label: "Failed", value: campaign.failed },
          { label: "Remaining", value: campaign.remaining },
          { label: "Busy / No Answer", value: (campaign.totalContacts - campaign.dialed - campaign.remaining) || 0 },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{pct}% complete</span>
          <span>{campaign.dialed} of {campaign.totalContacts}</span>
        </div>
        <Progress value={pct} className="h-3" />
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        {campaign.startedAt && <>Started {new Date(campaign.startedAt).toLocaleString()}</>}
        {campaign.completedAt && <> · Completed {new Date(campaign.completedAt).toLocaleString()}</>}
      </p>
    </div>
  );
}
