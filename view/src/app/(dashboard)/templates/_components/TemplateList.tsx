"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import { get, del } from "@/lib/api";
import { toast } from "sonner";
import type { MessageTemplate } from "@/lib/types";

interface Props { onEdit: (t: MessageTemplate) => void; refreshKey: number; }

export default function TemplateList({ onEdit, refreshKey }: Props) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<MessageTemplate[]>("/templates").then((r) => setTemplates((r.data as any) || [])).catch(() => {}).finally(() => setLoading(false));
  }, [refreshKey]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this template?")) return;
    try { await del(`/templates/${id}`); setTemplates((p) => p.filter((t) => t.id !== id)); toast.success("Deleted"); }
    catch { toast.error("Failed"); }
  }

  if (loading) return <LoadingSkeleton variant="card" count={3} />;
  if (templates.length === 0) return <p className="py-12 text-center text-sm text-muted-foreground">No templates yet.</p>;

  return (
    <div className="space-y-3">
      {templates.map((t) => (
        <div key={t.id} className="rounded-lg border p-4">
          <div className="flex items-start justify-between mb-2">
            <p className="font-medium">{t.name}</p>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => onEdit(t)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{t.body}</p>
          {(t.variables || []).length > 0 && <p className="text-xs text-muted-foreground mt-1">{t.variables.length} variable{t.variables.length > 1 ? "s" : ""}: {t.variables.join(", ")}</p>}
        </div>
      ))}
    </div>
  );
}
