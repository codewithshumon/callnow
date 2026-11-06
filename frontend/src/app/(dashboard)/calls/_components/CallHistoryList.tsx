"use client";

import { useEffect, useState, useCallback } from "react";
import { getPaginated } from "@/lib/api";
import { useCallStore } from "@/store/callStore";
import CallHistoryItem from "./CallHistoryItem";
import CallDetailSheet from "./CallDetailSheet";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import type { Call, Contact } from "@/lib/types";

export default function CallHistoryList() {
  const calls = useCallStore((s) => s.callHistory);
  const setCalls = useCallStore((s) => s.setCallHistory);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    try {
      const [callsRes, contactsRes] = await Promise.allSettled([
        getPaginated<Call>("/calls", { page: 1, limit: 20 }),
        getPaginated<Contact>("/contacts", { limit: 100 }),
      ]);
      if (callsRes.status === "fulfilled") setCalls(callsRes.value.data);
      if (contactsRes.status === "fulfilled") setContacts(contactsRes.value.data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [setCalls]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  if (loading) return <LoadingSkeleton variant="table" count={5} />;

  if (calls.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No calls recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {calls.map((call) => (
        <CallHistoryItem
          key={call.id}
          call={call}
          contacts={contacts}
          onOpenDetails={(c) => setSelectedCall(c)}
        />
      ))}
      <CallDetailSheet
        call={selectedCall}
        open={!!selectedCall}
        onClose={() => setSelectedCall(null)}
      />
    </div>
  );
}
