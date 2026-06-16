"use client";

import MessageThread from "../_components/MessageThread";

export default function ConversationPage() {
  return (
    <div className="flex h-[calc(100vh-0px)]">
      {/* On mobile: full-screen thread. On desktop: thread fills right side */}
      <div className="flex-1">
        <MessageThread />
      </div>
    </div>
  );
}
