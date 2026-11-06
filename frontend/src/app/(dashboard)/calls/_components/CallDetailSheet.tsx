"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Phone,
  MessageSquare,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  DollarSign,
  Copy,
  Check,
  Calendar,
  Radio,
  Share2,
  FileAudio,
} from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import DurationDisplay from "@/components/shared/DurationDisplay";
import TimestampDisplay from "@/components/shared/TimestampDisplay";
import InlineAudioPlayer from "./InlineAudioPlayer";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Call } from "@/lib/types";

interface Props {
  call: Call | null;
  open: boolean;
  onClose: () => void;
}

function formatPhone(num: string) {
  if (!num) return "—";
  try {
    const parsed = parsePhoneNumberFromString(num);
    return parsed ? parsed.formatInternational() : num;
  } catch {
    return num;
  }
}

export default function CallDetailSheet({ call, open, onClose }: Props) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!call) return null;

  const isOutbound = call.direction === "outbound";
  const contactNumber = isOutbound ? call.toNumber : call.fromNumber;
  const displayNumber = formatPhone(contactNumber);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-6 space-y-6">
        <SheetHeader className="p-0 space-y-2 border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "p-2 rounded-xl flex items-center justify-center",
                  isOutbound
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                )}
              >
                {isOutbound ? (
                  <ArrowUpRight className="h-5 w-5" />
                ) : (
                  <ArrowDownLeft className="h-5 w-5" />
                )}
              </div>
              <div>
                <SheetTitle className="text-lg font-semibold tracking-tight">
                  {isOutbound ? "Outbound Call" : "Inbound Call"}
                </SheetTitle>
                <SheetDescription className="text-xs">
                  ID: {call.id.slice(0, 8)}...
                </SheetDescription>
              </div>
            </div>
            <StatusBadge status={call.status} size="md" />
          </div>

          {/* Quick Action CTAs */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Link
              href={`/calls/dialpad?to=${encodeURIComponent(contactNumber)}`}
              onClick={onClose}
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "w-full gap-2 shadow-xs"
              )}
            >
              <Phone className="h-3.5 w-3.5" /> Call Back
            </Link>
            <Link
              href={`/messages?to=${encodeURIComponent(contactNumber)}`}
              onClick={onClose}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-full gap-2"
              )}
            >
              <MessageSquare className="h-3.5 w-3.5" /> Message
            </Link>
          </div>
        </SheetHeader>

        {/* Call Numbers & Participants */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Participants
          </h4>
          <Card className="border border-border/80 bg-muted/20 shadow-none">
            <CardContent className="p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground">From</span>
                  <p className="font-mono text-sm font-semibold">{formatPhone(call.fromNumber)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => copyToClipboard(call.fromNumber, "From number")}
                  title="Copy number"
                >
                  {copiedField === "From number" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </Button>
              </div>

              <div className="border-t border-border/60 pt-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground">To</span>
                  <p className="font-mono text-sm font-semibold">{formatPhone(call.toNumber)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => copyToClipboard(call.toNumber, "To number")}
                  title="Copy number"
                >
                  {copiedField === "To number" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metrics Grid */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Call Metrics
          </h4>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-1">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-primary" /> Duration
              </span>
              <p className="text-base font-semibold font-mono">
                <DurationDisplay seconds={call.durationSeconds} />
              </p>
            </div>

            <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-1">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Total Cost
              </span>
              <p className="text-base font-semibold font-mono">
                ${Number(call.cost || 0).toFixed(4)}
              </p>
            </div>
          </div>
        </div>

        {/* Recording Player if present */}
        {call.recordingUrl && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileAudio className="h-3.5 w-3.5 text-primary" /> Call Recording
            </h4>
            <InlineAudioPlayer src={call.recordingUrl} />
          </div>
        )}

        {/* Carrier & Telemetry */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Network & Provider Telemetry
          </h4>
          <div className="rounded-xl border border-border/80 bg-card divide-y text-xs">
            <div className="flex items-center justify-between p-3">
              <span className="text-muted-foreground">Telephony Provider</span>
              <Badge variant="outline" className="capitalize font-mono text-[11px]">
                {call.provider || "Twilio"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3">
              <span className="text-muted-foreground">Provider Call SID</span>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                <span>{call.providerSid || "N/A"}</span>
                {call.providerSid && (
                  <button
                    onClick={() => copyToClipboard(call.providerSid, "Call SID")}
                    className="hover:text-foreground transition-colors"
                  >
                    {copiedField === "Call SID" ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-3">
              <span className="text-muted-foreground">Started Time</span>
              <span className="font-mono text-muted-foreground">
                {new Date(call.startedAt).toLocaleString()}
              </span>
            </div>

            {call.endedAt && (
              <div className="flex items-center justify-between p-3">
                <span className="text-muted-foreground">Ended Time</span>
                <span className="font-mono text-muted-foreground">
                  {new Date(call.endedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
