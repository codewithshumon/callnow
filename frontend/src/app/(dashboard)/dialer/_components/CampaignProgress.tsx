import { Progress } from "@/components/ui/progress";

interface Props { dialed: number; total: number; callsPerMin?: number; startTime?: string; }

export default function CampaignProgress({ dialed, total, callsPerMin, startTime }: Props) {
  const pct = total > 0 ? Math.round((dialed / total) * 100) : 0;
  const elapsed = startTime ? Math.max(1, Math.floor((Date.now() - new Date(startTime).getTime()) / 60000)) : 0;
  const rate = callsPerMin ?? (elapsed > 0 ? Math.round(dialed / elapsed) : 0);
  const remaining = total - dialed;
  const etaMin = rate > 0 ? Math.round(remaining / rate) : 0;

  return (
    <div className="mb-6">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{pct}% complete ({dialed} of {total})</span>
        {rate > 0 && <span>{rate} calls/min · Est. {etaMin} min remaining</span>}
      </div>
      <Progress value={pct} className="h-3" />
    </div>
  );
}
