"use client";

import ConversationList from "./_components/ConversationList";

export default function MessagesPage() {
  return (
    <div className="flex h-[calc(100vh-0px)]">
      {/* Conversation list — full width on mobile, 320px sidebar on desktop */}
      <div className="w-full lg:w-80 lg:shrink-0">
        <ConversationList />
      </div>
      {/* Empty state — visible on desktop when no conversation is selected */}
      <div className="hidden flex-1 items-center justify-center lg:flex">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Select a conversation or start a new one
          </p>
        </div>
      </div>
    </div>
  );
}
