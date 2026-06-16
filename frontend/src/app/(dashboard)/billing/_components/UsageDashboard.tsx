import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { UsageRecord } from "@/lib/types";

interface Props { usage: UsageRecord | null; }

export default function UsageDashboard({ usage }: Props) {
  const metrics = [
    { label: "Minutes", used: usage?.usage.minutesUsed || 0, total: usage?.usage.minutesIncluded || 0, pct: usage ? Math.round((usage.usage.minutesUsed / usage.usage.minutesIncluded) * 100) : 0 },
    { label: "SMS", used: usage?.usage.smsUsed || 0, total: usage?.usage.smsIncluded || 0, pct: usage ? Math.round((usage.usage.smsUsed / usage.usage.smsIncluded) * 100) : 0 },
    { label: "Numbers", used: usage?.usage.numbersHeld || 0, total: usage?.usage.numbersAllowed || 0, pct: usage ? Math.round((usage.usage.numbersHeld / usage.usage.numbersAllowed) * 100) : 0 },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {metrics.map((m) => (
        <Card key={m.label}>
          <CardContent className="p-4 text-center">
            <p className="text-lg font-bold">{m.used} / {m.total}</p>
            <p className="text-xs text-muted-foreground mb-2">{m.label}</p>
            <Progress value={m.pct} className={cn("h-2", m.pct >= 80 ? "[&>div]:bg-red-500" : m.pct >= 50 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500")} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
