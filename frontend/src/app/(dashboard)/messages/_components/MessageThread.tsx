"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  MoreVertical,
  SendHorizontal,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Copy,
  ExternalLink,
  Sparkles,
  Paperclip,
  Smile,
  LayoutTemplate,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMessageStore } from "@/store/messageStore";
import { useCallStore } from "@/store/callStore";
import { useAuthStore } from "@/store/authStore";
import { get, getPaginated, post, extractApiError } from "@/lib/api";
import { initializeCallClient, makeCall } from "@/lib/webrtc";
import type { Message, CallToken, MessageTemplate } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { parsePhoneNumberFromString } from "libphonenumber-js";

function formatPhone(num: string) {
  if (!num) return "";
  try {
    const p = parsePhoneNumberFromString(num);
    return p ? p.formatInternational() : num;
  } catch {
    return num;
  }
}

export default function MessageThread() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const messages = useMessageStore((s) => (id ? s.messages[id] : undefined)) || [];
  const setMessages = useMessageStore((s) => s.setMessages);
  const addMessage = useMessageStore((s) => s.addMessage);
  const isLoading = useMessageStore((s) => s.isLoadingMessages);
  const setLoading = useMessageStore((s) => s.setLoadingMessages);
  const conversations = useMessageStore((s) => s.conversations);
  const markRead = useMessageStore((s) => s.markRead);
  const accessToken = useAuthStore((s) => s.accessToken);
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const conversation = conversations.find((c) => c.id === id);

  // Fetch messages
  useEffect(() => {
    if (!id || !accessToken) return;
    setLoading(true);
    getPaginated<Message>(`/conversations/${id}/messages`)
      .then((res) => {
        setMessages(id, res.data || []);
        markRead(id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Load message templates for quick insert
  useEffect(() => {
    get<MessageTemplate[]>("/templates")
      .then((r) => setTemplates((r.data as any) || []))
      .catch(() => {});
  }, []);

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
      useMessageStore.getState().updateMessageStatus(optimistic.id, "failed");
    });
  }

  async function handleCall() {
    if (!conversation) return;
    try {
      const res = await get<CallToken>("/calls/token");
      await initializeCallClient(res.data);
      makeCall({ to: conversation.toNumber, from: conversation.fromNumber });
      toast.success(`Calling ${conversation.toNumber}...`);
    } catch {
      toast.error("Could not initiate call. Please ensure your mic and caller ID are ready.");
    }
  }

  function copyNumber() {
    if (conversation?.toNumber) {
      navigator.clipboard.writeText(conversation.toNumber);
      toast.success("Phone number copied to clipboard");
    }
  }

  function statusIcon(status: string) {
    switch (status) {
      case "queued":
        return <Clock className="h-3 w-3 text-muted-foreground/60" />;
      case "sent":
        return <Check className="h-3 w-3 text-muted-foreground/70" />;
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-sky-400" />;
      case "failed":
        return <AlertCircle className="h-3 w-3 text-red-400" />;
      default:
        return null;
    }
  }

  const contactInitials = useMemo(() => {
    if (conversation?.contactName) {
      return conversation.contactName
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    }
    return "#";
  }, [conversation?.contactName]);

  if (!id) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/10">
        <p className="text-sm">Select a conversation from the list to start messaging.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-border/80 px-4 sm:px-6 py-3.5 bg-card/60 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/messages")}
            className="lg:hidden h-9 w-9 rounded-xl"
            title="Back to inbox"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <Avatar className="h-10 w-10 border border-border/80 shadow-sm">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
              {contactInitials}
            </AvatarFallback>
          </Avatar>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">
                {conversation?.contactName || formatPhone(conversation?.toNumber || "") || "Unknown Contact"}
              </h3>
              {conversation?.contactName && (
                <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                  {formatPhone(conversation.toNumber)}
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-mono">
              <span>Via Line:</span>
              <span className="text-foreground/80 font-medium">
                {formatPhone(conversation?.fromNumber || "")}
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCall}
            className="h-9 rounded-xl text-xs font-semibold gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
            title="Call with WebRTC Softphone"
          >
            <Phone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Call Line</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer outline-none">
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg">
              <DropdownMenuItem onClick={copyNumber} className="text-xs gap-2">
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Phone Number</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/calls/dialpad?to=${encodeURIComponent(conversation?.toNumber || "")}`)}
                className="text-xs gap-2"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open in Dialpad</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowTemplateModal(true)}
                className="text-xs gap-2"
              >
                <LayoutTemplate className="h-3.5 w-3.5" />
                <span>Insert Template</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {isLoading && (
          <div className="space-y-4 py-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}
              >
                <div className="h-14 w-60 rounded-2xl bg-muted/60 animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="py-20 text-center space-y-3 max-w-sm mx-auto">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <SendHorizontal className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">No messages yet</h4>
            <p className="text-xs text-muted-foreground">
              Send your first SMS to {conversation?.contactName || conversation?.toNumber}. Outbound messages will be sent from {conversation?.fromNumber}.
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isOutbound = msg.direction === "outbound";
          return (
            <div
              key={msg.id}
              className={cn("flex items-end gap-2", isOutbound ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] sm:max-w-[70%] rounded-2xl p-3.5 shadow-sm text-xs sm:text-sm leading-relaxed transition-all",
                  isOutbound
                    ? "bg-primary text-primary-foreground rounded-br-sm shadow-primary/10"
                    : "bg-muted/70 text-foreground border border-border/70 rounded-bl-sm"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{msg.body}</p>

                {/* MMS Media Attachments */}
                {msg.mediaUrls && msg.mediaUrls.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-1.5 pt-1">
                    {msg.mediaUrls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg overflow-hidden border border-white/20 block hover:opacity-90 transition-opacity"
                      >
                        <img src={url} alt="MMS Attachment" className="h-28 w-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Timestamp & Status Icon */}
                <div className={cn(
                  "mt-1.5 flex items-center justify-end gap-1 text-[10px]",
                  isOutbound ? "text-primary-foreground/75" : "text-muted-foreground"
                )}>
                  <span>
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {isOutbound && statusIcon(msg.status)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <MessageInput
        onSend={handleSend}
        onOpenTemplates={() => setShowTemplateModal(true)}
      />

      {/* Quick Insert Template Dialog */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="max-w-md rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <LayoutTemplate className="h-4 w-4 text-primary" />
              <span>Choose Message Template</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-72 overflow-y-auto pt-2">
            {templates.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No templates configured yet. You can create them in <Link href="/templates" className="text-primary underline">Templates</Link>.
              </p>
            ) : (
              templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    handleSend(tpl.body);
                    setShowTemplateModal(false);
                    toast.success(`Template "${tpl.name}" sent`);
                  }}
                  className="w-full text-left p-3 rounded-xl border border-border/70 hover:border-primary/50 hover:bg-muted/40 transition-colors space-y-1 block"
                >
                  <p className="text-xs font-bold text-foreground">{tpl.name}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{tpl.body}</p>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MessageInput({
  onSend,
  onOpenTemplates,
}: {
  onSend: (body: string) => void;
  onOpenTemplates: () => void;
}) {
  const [body, setBody] = useState("");
  const maxLen = 1600;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    onSend(body.trim());
    setBody("");
  }

  // Calculate SMS segment count (160 standard, 153 for multi-part)
  const segments = useMemo(() => {
    const len = body.length;
    if (len <= 160) return len > 0 ? 1 : 0;
    return Math.ceil(len / 153);
  }, [body.length]);

  return (
    <form onSubmit={handleSubmit} className="border-t border-border/80 p-3 sm:p-4 bg-card/60 backdrop-blur space-y-2">
      <div className="flex items-end gap-2 rounded-2xl border border-border/80 bg-background/90 p-2 shadow-inner focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onOpenTemplates}
          className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground shrink-0"
          title="Insert saved template"
        >
          <LayoutTemplate className="h-4 w-4" />
        </Button>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Type an SMS or MMS message... (Enter to send)"
          rows={2}
          maxLength={maxLen}
          className="flex-1 resize-none bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/50 outline-none leading-relaxed"
        />

        <Button
          type="submit"
          size="icon"
          disabled={!body.trim()}
          className="h-9 w-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shrink-0 transition active:scale-95 disabled:opacity-40"
          title="Send SMS"
        >
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
        <span>Press <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">Enter ↵</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">Shift+Enter</kbd> for new line</span>
        <span className="font-mono">
          {body.length}/{maxLen} chars &bull; {segments} segment{segments !== 1 ? "s" : ""}
        </span>
      </div>
    </form>
  );
}
