import { ArrowUpRight, ArrowDownLeft, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import DurationDisplay from "@/components/shared/DurationDisplay";
import StatusBadge from "@/components/shared/StatusBadge";
import type { Call } from "@/lib/types";

interface Props { call: Call; isExpanded: boolean; onToggle: () => void; }

export default function CallHistoryItem({ call, isExpanded, onToggle }: Props) {
  const DirIcon = call.direction === "outbound" ? ArrowUpRight : ArrowDownLeft;

  return (
    <div className="rounded-lg border">
      <button onClick={onToggle} className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors">
        <DirIcon className={cn("h-4 w-4 shrink-0", call.direction === "outbound" ? "text-blue-500" : "text-green-500")} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{call.toNumber || call.fromNumber}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <StatusBadge status={call.status} />
            <span><DurationDisplay seconds={call.durationSeconds} /></span>
            <span>${call.cost}</span>
            <span>{new Date(call.startedAt).toLocaleString()}</span>
          </div>
        </div>
      </button>
      {isExpanded && (
        <div className="border-t px-4 py-3 text-sm space-y-2">
          <p><strong>From:</strong> {call.fromNumber}</p>
          <p><strong>To:</strong> {call.toNumber}</p>
          <p><strong>Provider:</strong> {call.provider} ({call.providerSid})</p>
          {call.recordingUrl && (
            <div><strong>Recording:</strong> <audio controls src={call.recordingUrl} className="mt-1 h-8 w-full max-w-xs" /></div>
          )}
        </div>
      )}
    </div>
  );
}
