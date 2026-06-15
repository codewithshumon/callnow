"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Upload, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPaginated, post, put, del, postForm, extractApiError } from "@/lib/api";
import Papa from "papaparse";
import type { Contact } from "@/lib/types";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formPhones, setFormPhones] = useState<Array<{ number: string; label: string }>>([{ number: "", label: "mobile" }]);

  const fetchContacts = useCallback(async () => {
    try {
      const params: Record<string, unknown> = { page: 1, limit: 50 };
      if (search) params.search = search;
      const res = await getPaginated<Contact>("/contacts", params);
      setContacts(res.data);
    } catch { /* */ } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  function openEdit(c: Contact) {
    setEditing(c);
    setFormName(c.name);
    setFormEmail(c.email || "");
    setFormNotes(c.notes || "");
    setFormTags((c.tags || []).join(", "));
    setFormPhones(c.phones?.length ? c.phones.map((p) => ({ number: p.number, label: p.label })) : [{ number: "", label: "mobile" }]);
    setShowForm(true);
  }

  function openCreate() {
    setEditing(null);
    setFormName(""); setFormEmail(""); setFormNotes(""); setFormTags("");
    setFormPhones([{ number: "", label: "mobile" }]);
    setShowForm(true);
  }

  async function handleSave() {
    if (!formName.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        email: formEmail.trim() || undefined,
        notes: formNotes.trim() || undefined,
        tags: formTags.split(",").map((t) => t.trim()).filter(Boolean),
        phones: formPhones.filter((p) => p.number.trim()),
      };
      if (editing) await put(`/contacts/${editing.id}`, payload);
      else await post("/contacts", payload);
      toast.success(editing ? "Contact updated" : "Contact created");
      setShowForm(false);
      fetchContacts();
    } catch (err) { toast.error(extractApiError(err).message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this contact?")) return;
    try { await del(`/contacts/${id}`); toast.success("Deleted"); fetchContacts(); }
    catch { toast.error("Failed to delete"); }
  }

  // CSV Import
  async function handleImport(file: File) {
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async (results) => {
        const fd = new FormData();
        fd.append("contacts", file);
        try {
          await postForm("/contacts/import", fd);
          toast.success(`Imported ${results.data.length} contacts`);
          setShowImport(false);
          fetchContacts();
        } catch (err) { toast.error(extractApiError(err).message); }
      },
    });
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Contacts</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowImport(true)}><Upload className="mr-1 h-4 w-4" /> Import</Button>
          <Button size="sm" onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Add</Button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search contacts..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading && <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>}
      {!loading && contacts.length === 0 && <div className="py-16 text-center text-sm text-muted-foreground">No contacts yet. Add contacts to see caller names instead of numbers.</div>}

      <div className="space-y-2">
        {contacts.map((c) => (
          <div key={c.id} className="flex items-start justify-between rounded-lg border p-4">
            <div className="min-w-0">
              <p className="font-medium">{c.name}</p>
              {c.phones?.[0] && <p className="text-sm text-muted-foreground">{c.phones[0].number} ({c.phones[0].label})</p>}
              {c.email && <p className="text-sm text-muted-foreground">{c.email}</p>}
              <div className="flex gap-1 mt-1">{c.tags?.map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}</div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Contact</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-auto">
            <div className="space-y-1"><Label>Name *</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} /></div>
            <div className="space-y-1"><Label>Email</Label><Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} /></div>
            <div className="space-y-1">
              <Label>Phones</Label>
              {formPhones.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <Select value={p.label} onValueChange={(v) => { const updated = [...formPhones]; updated[i].label = v ?? "mobile"; setFormPhones(updated); }}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mobile">Mobile</SelectItem><SelectItem value="work">Work</SelectItem><SelectItem value="home">Home</SelectItem><SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input value={p.number} onChange={(e) => { const u = [...formPhones]; u[i].number = e.target.value; setFormPhones(u); }} placeholder="+14155551234" className="flex-1" />
                  <Button variant="ghost" size="icon" onClick={() => setFormPhones((prev) => prev.filter((_, idx) => idx !== i))}>✕</Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setFormPhones((prev) => [...prev, { number: "", label: "mobile" }])}>+ Add phone</Button>
            </div>
            <div className="space-y-1"><Label>Notes</Label><Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} /></div>
            <div className="space-y-1"><Label>Tags (comma-separated)</Label><Input value={formTags} onChange={(e) => setFormTags(e.target.value)} placeholder="vip, sales" /></div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Contact"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Import Contacts</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Upload a CSV with columns: name, phone, email, notes, tags</p>
            <div className="rounded-lg border-2 border-dashed p-8 text-center cursor-pointer hover:border-primary/50"
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleImport(f); }}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById("contact-csv")?.click()}
            >
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm">Drop CSV or click to browse</p>
              <input id="contact-csv" type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); }} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
