"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  Download,
  Check,
  Zap,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Receipt,
  Clock,
  Phone,
  MessageSquare,
  Hash,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { get, post } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { UsageRecord, Invoice } from "@/lib/types";

export default function BillingPage() {
  const [usage, setUsage] = useState<UsageRecord | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    Promise.all([
      get<UsageRecord>("/billing/usage")
        .then((r) => setUsage(r.data as any))
        .catch(() => {}),
      get<Invoice[]>("/billing/invoices")
        .then((r) => setInvoices((r.data as any) || []))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  async function handleUpgrade(planName = "Pro") {
    setUpgrading(true);
    try {
      const res = await post<{ url: string }>("/billing/upgrade", { plan: planName });
      if ((res.data as any)?.url) {
        window.location.href = (res.data as any).url;
      } else {
        toast.success(`Upgraded to ${planName} Plan successfully`);
      }
    } catch {
      toast.error("Could not initiate plan checkout");
    } finally {
      setUpgrading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 w-full min-w-0 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const minsPct = usage
    ? Math.min(100, Math.round((usage.usage.minutesUsed / (usage.usage.minutesIncluded || 1)) * 100))
    : 0;
  const smsPct = usage
    ? Math.min(100, Math.round((usage.usage.smsUsed / (usage.usage.smsIncluded || 1)) * 100))
    : 0;
  const numsPct = usage
    ? Math.min(100, Math.round((usage.usage.numbersHeld / (usage.usage.numbersAllowed || 1)) * 100))
    : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-w-0 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Billing & Resource Quotas
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage your subscription tier, usage consumption, payment methods, and tax invoices.
          </p>
        </div>

        <Button
          onClick={() => handleUpgrade("Pro")}
          disabled={upgrading}
          className="h-9 gap-1.5 text-xs shadow-xs bg-primary text-primary-foreground font-medium"
        >
          <Sparkles className="h-4 w-4" />
          <span>{upgrading ? "Processing..." : "Upgrade Subscription"}</span>
        </Button>
      </div>

      {/* Subscription Summary Banner */}
      <Card className="border border-border/80 bg-gradient-to-r from-card to-muted/30 shadow-2xs">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xl tracking-tight">
                    {usage?.plan || "Free Starter"} Plan
                  </h3>
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] uppercase">
                    Active
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Billing cycle: {usage?.period?.start || "Current Month"} → {usage?.period?.end || "Next Month"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-muted-foreground">Renewal Rate</p>
                <p className="font-bold font-mono text-lg">$29.00 / month</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpgrade("Enterprise")}
                className="text-xs"
              >
                Change Plan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Quota Gauges */}
      <div>
        <h3 className="text-base font-semibold mb-3">Monthly Usage Allocation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Minutes */}
          <Card className="border border-border/80 shadow-2xs">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-primary" /> Voice Minutes
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {minsPct}% used
                </span>
              </div>
              <p className="text-2xl font-bold font-mono">
                {usage?.usage.minutesUsed || 0}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  / {usage?.usage.minutesIncluded || 500} mins
                </span>
              </p>
              <Progress value={minsPct} className="h-2 rounded-full" />
              <p className="text-[11px] text-muted-foreground">
                {(usage?.usage.minutesIncluded || 500) - (usage?.usage.minutesUsed || 0)} minutes remaining this cycle
              </p>
            </CardContent>
          </Card>

          {/* SMS */}
          <Card className="border border-border/80 shadow-2xs">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-500" /> SMS Messages
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {smsPct}% used
                </span>
              </div>
              <p className="text-2xl font-bold font-mono">
                {usage?.usage.smsUsed || 0}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  / {usage?.usage.smsIncluded || 1000} msgs
                </span>
              </p>
              <Progress value={smsPct} className="h-2 rounded-full" />
              <p className="text-[11px] text-muted-foreground">
                {(usage?.usage.smsIncluded || 1000) - (usage?.usage.smsUsed || 0)} SMS remaining this cycle
              </p>
            </CardContent>
          </Card>

          {/* Phone Numbers */}
          <Card className="border border-border/80 shadow-2xs">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-emerald-500" /> Virtual Numbers
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {numsPct}% held
                </span>
              </div>
              <p className="text-2xl font-bold font-mono">
                {usage?.usage.numbersHeld || 0}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  / {usage?.usage.numbersAllowed || 5} DIDs
                </span>
              </p>
              <Progress value={numsPct} className="h-2 rounded-full" />
              <p className="text-[11px] text-muted-foreground">
                {(usage?.usage.numbersAllowed || 5) - (usage?.usage.numbersHeld || 0)} additional numbers available
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invoices and Statements */}
      <div>
        <h3 className="text-base font-semibold mb-3">Billing History & Invoices</h3>
        {invoices.length === 0 ? (
          <Card className="border border-dashed border-border/80 bg-muted/20">
            <CardContent className="py-12 text-center space-y-2">
              <Receipt className="h-8 w-8 mx-auto text-muted-foreground/60" />
              <p className="font-medium text-sm">No invoices issued yet</p>
              <p className="text-xs text-muted-foreground">
                Invoices for subscription renewals and usage charges will be posted here with downloadable receipts.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="border border-border/80 rounded-2xl overflow-hidden divide-y divide-border/60 bg-card">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-muted/60 flex items-center justify-center">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-mono font-semibold text-sm">
                      ${Number(inv.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">{inv.period}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={cn(
                      "capitalize text-[10px]",
                      inv.status === "paid" &&
                        "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                    )}
                  >
                    {inv.status}
                  </Badge>

                  {inv.pdfUrl && (
                    <a
                      href={inv.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" /> PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
