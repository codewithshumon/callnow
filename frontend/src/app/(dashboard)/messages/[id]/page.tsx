"use client";

import ConversationList from "../_components/ConversationList";
import MessageThread from "../_components/MessageThread";

export default function ConversationPage() {
  return (
    <div className="flex h-screen w-full min-w-0 overflow-hidden bg-background">
      {/* On desktop: show the conversation list alongside the active chat */}
      <div className="hidden lg:block lg:w-[360px] xl:w-[400px] lg:shrink-0 border-r border-border/70 h-full bg-card/40">
        <ConversationList />
      </div>

      {/* Thread fills the remaining width */}
      <div className="flex-1 min-w-0 h-full flex flex-col">
        <MessageThread />
      </div>
    </div>
  );
}
