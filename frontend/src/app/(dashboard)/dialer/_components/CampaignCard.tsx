import Link from "next/link";
import { Play, Pause, Square, Download, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import type { Campaign, CampaignStatus } from "@/lib/types";

const typeVariant: Record<CampaignStatus, "default" | "secondary" | "destructive" | "outline"> = { draft: "outline", running: "default", paused: "secondary", completed: "secondary", stopped: "destructive" };

interface Props { campaign: Campaign; onAction: (id: string, action: string) => void; }

export default function CampaignCard({ campaign: c, onAction }: Props) {
  const pct = c.totalContacts > 0 ? Math.round((c.dialed / c.totalContacts) * 100) : 0;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-medium">{c.name}</h3>
          <StatusBadge status={c.status} size="md" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {c.status === "draft" && <Button size="sm" variant="outline" onClick={() => onAction(c.id, "start")}><Play className="h-3 w-3 mr-1" /> Start</Button>}
          {c.status === "running" && (<><Button size="sm" variant="outline" onClick={() => onAction(c.id, "pause")}><Pause className="h-3 w-3 mr-1" /> Pause</Button><Button size="sm" variant="destructive" onClick={() => onAction(c.id, "stop")}><Square className="h-3 w-3 mr-1" /> Stop</Button><Link href={`/dialer/${c.id}`}><Button size="sm" variant="outline"><Eye className="h-3 w-3 mr-1" /> Live</Button></Link></>)}
          {c.status === "paused" && (<><Button size="sm" variant="outline" onClick={() => onAction(c.id, "resume")}><Play className="h-3 w-3 mr-1" /> Resume</Button><Button size="sm" variant="destructive" onClick={() => onAction(c.id, "stop")}><Square className="h-3 w-3 mr-1" /> Stop</Button></>)}
          {(c.status === "completed" || c.status === "stopped") && <Button size="sm" variant="outline" onClick={() => onAction(c.id, "export")}><Download className="h-3 w-3 mr-1" /> Export</Button>}
        </div>
      </div>
      <Progress value={pct} className="h-2 mb-2" />
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>{c.dialed}/{c.totalContacts} dialed</span><span>✓ {c.answered}</span><span>✗ {c.failed}</span><span>⏳ {c.remaining}</span>
      </div>
    </Card>
  );
}
