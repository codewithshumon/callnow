"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { post, put } from "@/lib/api";
import type { MessageTemplate } from "@/lib/types";

function extractVariables(body: string): string[] {
  const matches = body.match(/\{(\w+)\}/g) || [];
  return [...new Set(matches.map((m) => m.slice(1, -1)))];
}

interface Props { open: boolean; onClose: () => void; template: MessageTemplate | null; onSaved: () => void; }

export default function TemplateFormDialog({ open, onClose, template, onSaved }: Props) {
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const variables = extractVariables(body);

  useEffect(() => {
    if (template) { setName(template.name); setBody(template.body); }
    else { setName(""); setBody(""); }
  }, [template, open]);

  async function handleSave() {
    if (!name.trim() || !body.trim()) { toast.error("Name and body are required"); return; }
    setSaving(true);
    try {
      if (template) await put(`/templates/${template.id}`, { name: name.trim(), body: body.trim() });
      else await post("/templates", { name: name.trim(), body: body.trim() });
      toast.success(template ? "Updated" : "Created");
      onSaved(); onClose();
    } catch { toast.error("Failed"); }
    finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{template ? "Edit" : "New"} Template</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Quick reply" /></div>
          <div className="space-y-1"><Label>Body</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Hi {customer_name}, your order #{order_number} is on the way!" rows={4} /></div>
          {variables.length > 0 && <p className="text-xs">Variables: {variables.join(", ")}</p>}
          <Button className="w-full" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Template"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
