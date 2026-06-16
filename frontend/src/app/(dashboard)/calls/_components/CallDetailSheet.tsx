"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import DurationDisplay from "@/components/shared/DurationDisplay";
import StatusBadge from "@/components/shared/StatusBadge";
import type { Call } from "@/lib/types";

interface Props { call: Call | null; open: boolean; onClose: () => void; }

export default function CallDetailSheet({ call, open, onClose }: Props) {
  if (!call) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader><SheetTitle>Call Details</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={call.status} /></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Direction</span><span>{call.direction}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">From</span><span className="font-mono">{call.fromNumber}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">To</span><span className="font-mono">{call.toNumber}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><DurationDisplay seconds={call.durationSeconds} /></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Cost</span><span>${call.cost}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Provider</span><span>{call.provider}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Started</span><span>{new Date(call.startedAt).toLocaleString()}</span></div>
          {call.recordingUrl && (
            <div>
              <span className="text-muted-foreground">Recording</span>
              <audio controls src={call.recordingUrl} className="mt-1 w-full h-8" />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
