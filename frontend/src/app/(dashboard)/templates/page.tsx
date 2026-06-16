"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { get, post, put, del, extractApiError } from "@/lib/api";
import type { MessageTemplate } from "@/lib/types";

function extractVariables(body: string): string[] {
  const matches = body.match(/\{(\w+)\}/g) || [];
  return [...new Set(matches.map((m) => m.slice(1, -1)))];
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [formName, setFormName] = useState("");
  const [formBody, setFormBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    get<MessageTemplate[]>("/templates").then((r) => setTemplates((r.data as any) || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function openCreate() { setEditing(null); setFormName(""); setFormBody(""); setShowForm(true); }
  function openEdit(t: MessageTemplate) { setEditing(t); setFormName(t.name); setFormBody(t.body); setShowForm(true); }

  async function handleSave() {
    if (!formName.trim() || !formBody.trim()) { toast.error("Name and body are required"); return; }
    setSaving(true);
    try {
      if (editing) await put(`/templates/${editing.id}`, { name: formName.trim(), body: formBody.trim() });
      else await post("/templates", { name: formName.trim(), body: formBody.trim() });
      toast.success(editing ? "Template updated" : "Template created");
      setShowForm(false);
      const r = await get<MessageTemplate[]>("/templates");
      setTemplates((r.data as any) || []);
    } catch (err) { toast.error(extractApiError(err).message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template?")) return;
    try { await del(`/templates/${id}`); toast.success("Deleted"); setTemplates((p) => p.filter((t) => t.id !== id)); }
    catch { toast.error("Failed to delete"); }
  }

  const variables = extractVariables(formBody);

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Message Templates</h1>
        <Button size="sm" onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> New</Button>
      </div>

      {loading && <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>}
      {!loading && templates.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No templates yet. Create one for quick replies.</p>}

      <div className="space-y-3">
        {templates.map((t) => (
          <div key={t.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="font-medium">{t.name}</p>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{t.body}</p>
            {(t.variables || []).length > 0 && <p className="text-xs text-muted-foreground mt-1">{t.variables.length} variable{t.variables.length > 1 ? "s" : ""}: {t.variables.join(", ")}</p>}
          </div>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} Template</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Name</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Quick reply" /></div>
            <div className="space-y-1">
              <Label>Body</Label>
              <Textarea value={formBody} onChange={(e) => setFormBody(e.target.value)} placeholder="Hi {customer_name}, your order #{order_number} is on the way!" rows={4} />
              <p className="text-xs text-muted-foreground">Use {"{variable}"} placeholders</p>
            </div>
            {variables.length > 0 && <p className="text-xs">Detected variables: {variables.join(", ")}</p>}
            <Button className="w-full" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Template"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
