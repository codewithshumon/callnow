"use client";

import ConversationList from "./_components/ConversationList";
import { MessageSquare, ShieldCheck, Zap } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="flex h-screen w-full min-w-0 overflow-hidden bg-background">
      {/* Conversation list — full width on mobile, 360px on desktop */}
      <div className="w-full lg:w-[360px] xl:w-[400px] lg:shrink-0 border-r border-border/70 h-full bg-card/40">
        <ConversationList />
      </div>

      {/* Empty state — visible on desktop when no conversation is selected */}
      <div className="hidden flex-1 items-center justify-center lg:flex bg-muted/15 p-8">
        <div className="text-center max-w-md space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-xs">
            <MessageSquare className="h-8 w-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-bold text-xl tracking-tight">Your Direct Messaging Inbox</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Select an existing conversation from the list to view the full message thread, or click{" "}
              <span className="font-semibold text-foreground">New</span> to start a two-way SMS conversation.
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Carrier Verified
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-primary" /> Instant Delivery
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
