"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import { getPaginated, del } from "@/lib/api";
import { toast } from "sonner";
import type { Contact } from "@/lib/types";

interface Props { onEdit: (c: Contact) => void; onRefresh: () => void; refreshKey: number; }

export default function ContactTable({ onEdit, onRefresh, refreshKey }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page: 1, limit: 50 };
      if (search) params.search = search;
      const res = await getPaginated<Contact>("/contacts", params);
      setContacts(res.data);
    } catch { /* */ }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetch(); }, [fetch, refreshKey]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this contact?")) return;
    try { await del(`/contacts/${id}`); toast.success("Deleted"); fetch(); onRefresh(); }
    catch { toast.error("Failed to delete"); }
  }

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search contacts..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {loading && <LoadingSkeleton variant="table" count={4} />}
      {!loading && contacts.length === 0 && (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No contacts yet. Add contacts to see caller names instead of numbers.
        </div>
      )}
      <div className="space-y-2">
        {contacts.map((c) => (
          <div key={c.id} className="flex items-start justify-between rounded-lg border p-4">
            <div className="min-w-0">
              <p className="font-medium">{c.name}</p>
              {c.phones?.[0] && <p className="text-sm text-muted-foreground">{c.phones[0].number} ({c.phones[0].label})</p>}
              {c.email && <p className="text-sm text-muted-foreground">{c.email}</p>}
              <div className="flex gap-1 mt-1">{(c.tags || []).map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}</div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => onEdit(c)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
