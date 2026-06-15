"use client";

import { useEffect, useState } from "react";
import { CreditCard, Download, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { get, post } from "@/lib/api";
import { toast } from "sonner";
import type { UsageRecord, Invoice } from "@/lib/types";
import { cn } from "@/lib/utils";

function thresholdColor(pct: number): string {
  if (pct < 50) return "bg-green-500";
  if (pct < 80) return "bg-yellow-500";
  return "bg-red-500";
}

export default function BillingPage() {
  const [usage, setUsage] = useState<UsageRecord | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      get<UsageRecord>("/billing/usage").then((r) => setUsage(r.data as any)).catch(() => {}),
      get<Invoice[]>("/billing/invoices").then((r) => setInvoices((r.data as any) || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  async function handleUpgrade() {
    try {
      const res = await post<{ url: string }>("/billing/upgrade", { plan: "Pro" });
      window.location.href = (res.data as any).url;
    } catch { toast.error("Could not initiate checkout"); }
  }

  if (loading) return <div className="p-6 space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>;

  const minsPct = usage ? Math.round((usage.usage.minutesUsed / usage.usage.minutesIncluded) * 100) : 0;
  const smsPct = usage ? Math.round((usage.usage.smsUsed / usage.usage.smsIncluded) * 100) : 0;
  const numsPct = usage ? Math.round((usage.usage.numbersHeld / usage.usage.numbersAllowed) * 100) : 0;

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-6">Billing & Usage</h1>

      {/* Plan Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              {usage?.plan || "Free"} Plan
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleUpgrade}>Upgrade</Button>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>Period: {usage?.period?.start} → {usage?.period?.end}</p>
        </CardContent>
      </Card>

      {/* Usage */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {[{ label: "Minutes", used: usage?.usage.minutesUsed || 0, total: usage?.usage.minutesIncluded || 0, pct: minsPct },
          { label: "SMS", used: usage?.usage.smsUsed || 0, total: usage?.usage.smsIncluded || 0, pct: smsPct },
          { label: "Numbers", used: usage?.usage.numbersHeld || 0, total: usage?.usage.numbersAllowed || 0, pct: numsPct },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4 text-center">
              <p className="text-lg font-bold">{m.used} / {m.total}</p>
              <p className="text-xs text-muted-foreground mb-2">{m.label}</p>
              <Progress value={m.pct} className={cn("h-2", m.pct >= 80 ? "[&>div]:bg-red-500" : m.pct >= 50 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-green-500")} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invoices */}
      <h2 className="text-lg font-semibold mb-3">Invoices</h2>
      {invoices.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No invoices yet.</p>}
      <div className="space-y-2">
        {invoices.map((inv) => (
          <div key={inv.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium">${inv.amount}</p>
              <p className="text-xs text-muted-foreground">{inv.period}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={inv.status === "paid" ? "default" : "secondary"} className="text-[10px]">{inv.status}</Badge>
              {inv.pdfUrl && (
                <a href={inv.pdfUrl} target="_blank" rel="noopener" className="text-primary hover:underline">
                  <Download className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
