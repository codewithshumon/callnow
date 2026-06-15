"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { get } from "@/lib/api";
import type { UsageRecord } from "@/lib/types";

export default function SidebarUsage() {
  const [usage, setUsage] = useState<UsageRecord | null>(null);

  useEffect(() => {
    get<UsageRecord>("/billing/usage").then((r) => setUsage(r.data as any)).catch(() => {});
  }, []);

  if (!usage) return null;

  const minsPct = usage.usage.minutesIncluded > 0 ? Math.round((usage.usage.minutesUsed / usage.usage.minutesIncluded) * 100) : 0;

  return (
    <div className="px-3 py-2 border-t">
      <div className="flex items-center justify-between mb-1">
        <Badge variant="outline" className="text-[10px]">{usage.plan}</Badge>
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
        <span>{usage.usage.minutesUsed} min</span>
        <span>{usage.usage.minutesIncluded} min</span>
      </div>
      <Progress value={minsPct} className="h-1.5" />
    </div>
  );
}
