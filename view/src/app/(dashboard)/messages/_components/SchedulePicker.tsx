"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

interface SchedulePickerProps { scheduledAt: string; onChange: (iso: string | null) => void; }

export default function SchedulePicker({ scheduledAt, onChange }: SchedulePickerProps) {
  return (
    <Popover>
      <PopoverTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted">
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <div className="space-y-2">
          <p className="text-sm font-medium">Schedule message</p>
          <input type="datetime-local" className="rounded border px-2 py-1 text-sm w-full"
            value={scheduledAt ? scheduledAt.slice(0, 16) : ""}
            onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)} />
          {scheduledAt && (
            <Button variant="outline" size="sm" className="w-full" onClick={() => onChange(null)}>Clear schedule</Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
