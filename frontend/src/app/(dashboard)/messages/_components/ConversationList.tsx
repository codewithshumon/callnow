"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useMessageStore } from "@/store/messageStore";
import { get, getPaginated } from "@/lib/api";
import type { Conversation, PhoneNumber } from "@/lib/types";
import { cn } from "@/lib/utils";
import NewMessageDialog from "@/components/messaging/NewMessageDialog";

export default function ConversationList() {
  const router = useRouter();
  const conversations = useMessageStore((s) => s.conversations);
  const setConversations = useMessageStore((s) => s.setConversations);
  const activeId = useMessageStore((s) => s.activeConversationId);
  const unreadCounts = useMessageStore((s) => s.unreadCounts);
  const isLoading = useMessageStore((s) => s.isLoadingConversations);
  const setLoading = useMessageStore((s) => s.setLoadingConversations);
  const [search, setSearch] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [userNumbers, setUserNumbers] = useState<PhoneNumber[]>([]);

  // Fetch conversations
  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const res = await getPaginated<Conversation>("/conversations");
        setConversations(res.data);
      } catch {
        // silently fail, user sees empty state
      } finally {
        setLoading(false);
      }
    }
    if (conversations.length === 0) fetch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch user's numbers for the new-message dialog
  useEffect(() => {
    async function fetch() {
      try {
        const res = await get<PhoneNumber[]>("/numbers");
        setUserNumbers(Array.isArray(res.data) ? res.data : []);
      } catch { /* ignore */ }
    }
    fetch();
  }, []);

  // Client-side filter
  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) =>
        c.contactName?.toLowerCase().includes(q) ||
        c.toNumber?.includes(q) ||
        c.fromNumber?.includes(q)
    );
  }, [conversations, search]);

  function formatTime(iso: string | undefined): string {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  }

  return (
    <div className="flex h-full flex-col border-r">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-lg font-semibold">Messages</h2>
        <Button size="sm" variant="outline" onClick={() => setShowNewDialog(true)}>
          <PenSquare className="mr-1 h-4 w-4" />
          New
        </Button>
      </div>
      <div className="px-4 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {isLoading && (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              {search
                ? "No conversations match your search"
                : "No messages yet. Click New to start a conversation."}
            </p>
          </div>
        )}
        {filtered.map((c) => {
          const unread = unreadCounts[c.id] || 0;
          return (
            <button
              key={c.id}
              onClick={() => router.push(`/messages/${c.id}`)}
              className={cn(
                "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                activeId === c.id && "bg-muted"
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <span className="text-sm font-medium text-primary">
                  {(c.contactName || c.toNumber || "?")[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-medium">
                    {c.contactName || c.toNumber || c.fromNumber}
                  </p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatTime(c.lastMessage?.createdAt)}
                  </span>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {c.lastMessage?.body || ""}
                </p>
              </div>
              {unread > 0 && (
                <span className="mt-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                  {unread}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <NewMessageDialog
        open={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        userNumbers={userNumbers}
      />
    </div>
  );
}
