import { Play, Pause, Square, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CampaignStatus } from "@/lib/types";

interface Props { status: CampaignStatus; onPause: () => void; onResume: () => void; onStop: () => void; onExport: () => void; }

export default function CampaignControls({ status, onPause, onResume, onStop, onExport }: Props) {
  if (status === "running") return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={onPause}><Pause className="h-3 w-3 mr-1" /> Pause</Button>
      <Button size="sm" variant="destructive" onClick={onStop}><Square className="h-3 w-3 mr-1" /> Stop</Button>
    </div>
  );
  if (status === "paused") return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={onResume}><Play className="h-3 w-3 mr-1" /> Resume</Button>
      <Button size="sm" variant="destructive" onClick={onStop}><Square className="h-3 w-3 mr-1" /> Stop</Button>
    </div>
  );
  if (status === "completed" || status === "stopped") return (
    <Button size="sm" variant="outline" onClick={onExport}><Download className="h-3 w-3 mr-1" /> Export CSV</Button>
  );
  return null;
}
