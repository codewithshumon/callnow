"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Phone, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMessageStore } from "@/store/messageStore";
import { useCallStore } from "@/store/callStore";
import { useAuthStore } from "@/store/authStore";
import { get, getPaginated, post, del, extractApiError } from "@/lib/api";
import { initializeCallClient, makeCall } from "@/lib/webrtc";
import type { Message, CallToken } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function MessageThread() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const messages = useMessageStore((s) => (id ? s.messages[id] : undefined)) || [];
  const setMessages = useMessageStore((s) => s.setMessages);
  const addMessage = useMessageStore((s) => s.addMessage);
  const updateConversation = useMessageStore((s) => s.updateConversation);
  const isLoading = useMessageStore((s) => s.isLoadingMessages);
  const setLoading = useMessageStore((s) => s.setLoadingMessages);
  const conversations = useMessageStore((s) => s.conversations);
  const markRead = useMessageStore((s) => s.markRead);
  const accessToken = useAuthStore((s) => s.accessToken);
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const conversation = conversations.find((c) => c.id === id);

  // Fetch messages
  useEffect(() => {
    if (!id || !accessToken) return;
    setLoading(true);
    getPaginated<Message>(`/conversations/${id}/messages`)
      .then((res) => {
        setMessages(id, res.data);
        markRead(id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleSend(body: string) {
    if (!id || !conversation) return;
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      conversationId: id,
      provider: "twilio",
      providerSid: "",
      direction: "outbound",
      body,
      mediaUrls: [],
      status: "queued",
      createdAt: new Date().toISOString(),
    };
    addMessage(id, optimistic);
    post<Message>("/messages", {
      fromNumber: conversation.fromNumber,
      toNumber: conversation.toNumber,
      body,
    }).catch(() => {
      // Mark optimistic message as failed
      useMessageStore.getState().updateMessageStatus(optimistic.id, "failed");
    });
  }

  async function handleCall() {
    if (!conversation) return;
    try {
      const res = await get<CallToken>("/calls/token");
      await initializeCallClient(res.data);
      makeCall({ to: conversation.toNumber, from: conversation.fromNumber });
    } catch {
      toast.error("Could not initiate call.");
    }
  }

  function statusIcon(status: string) {
    switch (status) {
      case "queued": return <span className="text-xs text-muted-foreground">○</span>;
      case "sent": return <span className="text-xs text-muted-foreground">✓</span>;
      case "delivered": return <span className="text-xs text-blue-500">✓✓</span>;
      case "failed": return <span className="text-xs text-destructive">❌</span>;
      default: return null;
    }
  }

  if (!id) return null;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/messages")} className="lg:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <p className="text-sm font-medium">{conversation?.contactName || conversation?.toNumber || "Conversation"}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleCall}>
          <Phone className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-10 rounded bg-muted animate-pulse" />
                </div>
                <div className="h-16 w-3/4 rounded-lg bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        )}
        {!isLoading && messages.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Start the conversation by sending a message below.
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "mb-4 flex",
              msg.direction === "outbound" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-4 py-2",
                msg.direction === "outbound"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
              <div className="mt-1 flex items-center justify-end gap-1">
                <span className="text-[10px] opacity-70">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {msg.direction === "outbound" && statusIcon(msg.status)}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} />
    </div>
  );
}

function MessageInput({ onSend }: { onSend: (body: string) => void }) {
  const [body, setBody] = useState("");
  const maxLen = 1600;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    onSend(body.trim());
    setBody("");
  }

  return (
    <form onSubmit={handleSubmit} className="border-t p-3">
      <div className="flex items-end gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Type a message..."
          rows={1}
          maxLength={maxLen}
          className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <Button type="submit" size="sm" disabled={!body.trim()}>
          Send
        </Button>
      </div>
      <p className="mt-1 text-right text-[10px] text-muted-foreground">
        {body.length}/{maxLen}
      </p>
    </form>
  );
}
