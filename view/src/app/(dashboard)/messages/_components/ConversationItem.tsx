"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import TimestampDisplay from "@/components/shared/TimestampDisplay";
import type { Conversation } from "@/lib/types";

interface Props { conversation: Conversation; isActive: boolean; unreadCount: number; }

export default function ConversationItem({ conversation, isActive, unreadCount }: Props) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/messages/${conversation.id}`)}
      className={cn("flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50", isActive && "bg-muted")}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <span className="text-sm font-medium text-primary">
          {(conversation.contactName || conversation.toNumber || "?")[0].toUpperCase()}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-sm font-medium">{conversation.contactName || conversation.toNumber || conversation.fromNumber}</p>
          <TimestampDisplay iso={conversation.lastMessage?.createdAt} className="shrink-0" />
        </div>
        <p className="truncate text-xs text-muted-foreground">{conversation.lastMessage?.body || ""}</p>
      </div>
      {unreadCount > 0 && (
        <span className="mt-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
          {unreadCount}
        </span>
      )}
    </button>
  );
}
