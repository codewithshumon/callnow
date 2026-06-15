"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Play, Pause, Square, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getPaginated, post } from "@/lib/api";
import { toast } from "sonner";
import type { Campaign, CampaignStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusVariant: Record<CampaignStatus, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  running: "default",
  paused: "secondary",
  completed: "secondary",
  stopped: "destructive",
};

export default function CampaignListPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchCampaigns() {
    setLoading(true);
    try {
      const res = await getPaginated<Campaign>("/campaigns");
      setCampaigns(res.data);
    } catch { /* */ }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchCampaigns(); }, []);

  async function handleAction(id: string, action: string) {
    try {
      await post(`/campaigns/${id}/${action}`);
      toast.success(`Campaign ${action}ed`);
      fetchCampaigns();
    } catch { toast.error(`Failed to ${action} campaign`); }
  }

  async function handleExport(id: string) {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/campaigns/${id}/export`, "_blank");
  }

  if (loading) return <div className="p-6 space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}</div>;

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Campaigns</h1>
        <Link href="/dialer/new"><Button><Plus className="mr-1 h-4 w-4" /> New Campaign</Button></Link>
      </div>

      {campaigns.length === 0 && (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No campaigns yet. Create your first calling campaign to reach leads at scale.
        </div>
      )}

      <div className="space-y-4">
        {campaigns.map((c) => {
          const pct = c.totalContacts > 0 ? Math.round((c.dialed / c.totalContacts) * 100) : 0;
          return (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium">{c.name}</h3>
                  <Badge variant={statusVariant[c.status]} className="mt-1 text-[10px]">{c.status}</Badge>
                </div>
                <div className="flex gap-1">
                  {c.status === "draft" && (
                    <><Button size="sm" variant="outline" onClick={() => handleAction(c.id, "start")}><Play className="h-3 w-3" /> Start</Button></>
                  )}
                  {c.status === "running" && (
                    <><Button size="sm" variant="outline" onClick={() => handleAction(c.id, "pause")}><Pause className="h-3 w-3" /> Pause</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleAction(c.id, "stop")}><Square className="h-3 w-3" /> Stop</Button>
                    <Link href={`/dialer/${c.id}`}><Button size="sm" variant="outline"><Eye className="h-3 w-3" /> Live</Button></Link></>
                  )}
                  {c.status === "paused" && (
                    <><Button size="sm" variant="outline" onClick={() => handleAction(c.id, "resume")}><Play className="h-3 w-3" /> Resume</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleAction(c.id, "stop")}><Square className="h-3 w-3" /> Stop</Button>
                    <Link href={`/dialer/${c.id}`}><Button size="sm" variant="outline"><Eye className="h-3 w-3" /> View</Button></Link></>
                  )}
                  {(c.status === "completed" || c.status === "stopped") && (
                    <><Button size="sm" variant="outline" onClick={() => handleExport(c.id)}><Download className="h-3 w-3" /> Export</Button>
                    <Link href={`/dialer/${c.id}`}><Button size="sm" variant="outline"><Eye className="h-3 w-3" /> View</Button></Link></>
                  )}
                </div>
              </div>
              <Progress value={pct} className="h-2 mb-2" />
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{c.dialed}/{c.totalContacts} dialed</span>
                <span>✓ {c.answered} answered</span>
                <span>✗ {c.failed} failed</span>
                <span>⏳ {c.remaining} remaining</span>
              </div>
              {c.startedAt && <p className="text-xs text-muted-foreground mt-2">Started {new Date(c.startedAt).toLocaleString()}</p>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
