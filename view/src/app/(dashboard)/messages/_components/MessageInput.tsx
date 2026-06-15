"use client";

import { useState } from "react";
import { Smile, Paperclip, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import CharCounter from "@/components/messaging/CharCounter";
import SchedulePicker from "./SchedulePicker";

interface Props { onSend: (body: string, scheduledAt?: string) => void; }

export default function MessageInput({ onSend }: Props) {
  const [body, setBody] = useState("");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const maxLen = 1600;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    onSend(body.trim(), scheduledAt || undefined);
    setBody("");
    setScheduledAt("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t p-3">
      {scheduledAt && (
        <div className="mb-2 text-xs text-muted-foreground">
          Scheduled: {new Date(scheduledAt).toLocaleString()}
          <button type="button" onClick={() => setScheduledAt("")} className="ml-2 text-destructive">Clear</button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Emoji">
          <Smile className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Attach file">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
        </Button>
        <textarea
          value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Type a message..." rows={1} maxLength={maxLen}
          className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <SchedulePicker scheduledAt={scheduledAt} onChange={(v) => setScheduledAt(v || "")} />
        <Button type="submit" size="icon" className="h-8 w-8 shrink-0" disabled={!body.trim() && !scheduledAt}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <CharCounter current={body.length} max={maxLen} />
    </form>
  );
}
