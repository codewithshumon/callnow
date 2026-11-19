"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownLeft,
  PhoneOff,
  Phone,
  MessageSquare,
  Clock,
  Info,
  FileAudio,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import DurationDisplay from "@/components/shared/DurationDisplay";
import TimestampDisplay from "@/components/shared/TimestampDisplay";
import InlineAudioPlayer from "./InlineAudioPlayer";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { cn } from "@/lib/utils";
import type { Call, Contact } from "@/lib/types";

interface Props {
  call: Call;
  contacts?: Contact[];
  onOpenDetails: (call: Call) => void;
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

export default function CallHistoryItem({ call, contacts = [], onOpenDetails }: Props) {
  const isOutbound = call.direction === "outbound";
  const isMissed = call.status === "no-answer" || call.status === "busy" || call.status === "failed";
  const contactNumber = isOutbound ? call.toNumber : call.fromNumber;

  // Attempt to match with saved contacts
  const matchedContact = contacts.find(
    (c) =>
      c.phones?.some(
        (p) =>
          p.number === contactNumber ||
          p.number === call.toNumber ||
          p.number === call.fromNumber
      )
  );

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border/70 bg-card hover:bg-muted/40 transition-all p-3.5 sm:p-4 shadow-2xs hover:shadow-sm space-y-3"
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Direction Icon + Contact / Phone + Timing */}
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <div
            className={cn(
              "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center transition-colors",
              isMissed
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                : isOutbound
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            )}
          >
            {isMissed ? (
              <PhoneOff className="h-5 w-5" />
            ) : isOutbound ? (
              <ArrowUpRight className="h-5 w-5" />
            ) : (
              <ArrowDownLeft className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-foreground truncate">
                {matchedContact ? matchedContact.name : formatPhone(contactNumber)}
              </span>
              <StatusBadge status={call.status} size="sm" />
              {call.provider && (
                <span className="hidden md:inline-block font-mono text-[10px] uppercase text-muted-foreground border border-border/80 rounded px-1.5 py-0.2">
                  {call.provider}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
              {matchedContact && (
                <span className="font-mono text-[11px] text-muted-foreground/90">
                  {formatPhone(contactNumber)}
                </span>
              )}
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <Clock className="h-3 w-3" />
                <DurationDisplay seconds={call.durationSeconds} />
              </span>
              <span>•</span>
              <span className="font-mono text-[11px]">
                ${Number(call.cost || 0).toFixed(4)}
              </span>
              <span>•</span>
              <TimestampDisplay iso={call.startedAt} relative={true} />
            </div>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
          <Link
            href={`/calls/dialpad?to=${encodeURIComponent(contactNumber)}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-8 px-2.5 text-xs gap-1.5 hover:bg-primary hover:text-primary-foreground transition-all"
            )}
            title="Call back"
          >
            <Phone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Call</span>
          </Link>

          <Link
            href={`/messages?to=${encodeURIComponent(contactNumber)}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-8 px-2.5 text-xs gap-1.5"
            )}
            title="Send SMS"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">SMS</span>
          </Link>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenDetails(call)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="View Details"
          >
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Recording Player Bar (if call has recording) */}
      {call.recordingUrl && (
        <div className="pt-1 border-t border-border/50">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 shrink-0">
              <FileAudio className="h-3.5 w-3.5 text-primary" /> Recording:
            </span>
            <div className="flex-1">
              <InlineAudioPlayer src={call.recordingUrl} compact={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
