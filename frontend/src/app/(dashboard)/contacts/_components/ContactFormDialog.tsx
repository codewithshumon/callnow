"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { post, put } from "@/lib/api";
import type { Contact } from "@/lib/types";

interface Props { open: boolean; onClose: () => void; contact: Contact | null; onSaved: () => void; }

export default function ContactFormDialog({ open, onClose, contact, onSaved }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [phones, setPhones] = useState<Array<{ number: string; label: string }>>([{ number: "", label: "mobile" }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (contact) {
      setName(contact.name); setEmail(contact.email || ""); setNotes(contact.notes || "");
      setTags((contact.tags || []).join(", "));
      setPhones(contact.phones?.length ? contact.phones.map((p) => ({ number: p.number, label: p.label })) : [{ number: "", label: "mobile" }]);
    } else {
      setName(""); setEmail(""); setNotes(""); setTags(""); setPhones([{ number: "", label: "mobile" }]);
    }
  }, [contact, open]);

  async function handleSave() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const payload = { name: name.trim(), email: email.trim() || undefined, notes: notes.trim() || undefined, tags: tags.split(",").map((t) => t.trim()).filter(Boolean), phones: phones.filter((p) => p.number.trim()) };
      if (contact) await put(`/contacts/${contact.id}`, payload);
      else await post("/contacts", payload);
      toast.success(contact ? "Updated" : "Created");
      onSaved(); onClose();
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{contact ? "Edit" : "Add"} Contact</DialogTitle></DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-auto">
          <div className="space-y-1"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1"><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-1"><Label>Phones</Label>
            {phones.map((p, i) => (
              <div key={i} className="flex gap-2">
                <Select value={p.label} onValueChange={(v) => { const u = [...phones]; u[i].label = v ?? "mobile"; setPhones(u); }}>
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="mobile">Mobile</SelectItem><SelectItem value="work">Work</SelectItem><SelectItem value="home">Home</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                </Select>
                <Input value={p.number} onChange={(e) => { const u = [...phones]; u[i].number = e.target.value; setPhones(u); }} placeholder="+14155551234" className="flex-1" />
                <Button variant="ghost" size="icon" onClick={() => setPhones((prev) => prev.filter((_, idx) => idx !== i))}>✕</Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setPhones((prev) => [...prev, { number: "", label: "mobile" }])}>+ Add phone</Button>
          </div>
          <div className="space-y-1"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
          <div className="space-y-1"><Label>Tags (comma-separated)</Label><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="vip, sales" /></div>
          <Button className="w-full" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Contact"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
