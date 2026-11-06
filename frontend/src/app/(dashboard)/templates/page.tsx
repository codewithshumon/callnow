"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  Check,
  LayoutTemplate,
  Sparkles,
  Search,
  Code2,
  Variable,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { get, post, put, del, extractApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { MessageTemplate } from "@/lib/types";

function extractVariables(body: string): string[] {
  const matches = body.match(/\{(\w+)\}/g) || [];
  return [...new Set(matches.map((m) => m.slice(1, -1)))];
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [formName, setFormName] = useState("");
  const [formBody, setFormBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      const res = await get<MessageTemplate[]>("/templates");
      setTemplates((res.data as any) || []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  function openCreate() {
    setEditing(null);
    setFormName("");
    setFormBody("");
    setShowForm(true);
  }

  function openEdit(t: MessageTemplate) {
    setEditing(t);
    setFormName(t.name);
    setFormBody(t.body);
    setShowForm(true);
  }

  async function handleSave() {
    if (!formName.trim() || !formBody.trim()) {
      toast.error("Template name and message body are required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await put(`/templates/${editing.id}`, {
          name: formName.trim(),
          body: formBody.trim(),
        });
      } else {
        await post("/templates", {
          name: formName.trim(),
          body: formBody.trim(),
        });
      }
      toast.success(editing ? "Template updated" : "Template created");
      setShowForm(false);
      fetchTemplates();
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this message template?")) return;
    try {
      await del(`/templates/${id}`);
      toast.success("Template deleted");
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch {
      toast.error("Failed to delete template");
    }
  }

  const copyTemplateBody = (body: string, id: string) => {
    navigator.clipboard.writeText(body);
    setCopiedId(id);
    toast.success("Copied template text");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered
  const filtered = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.body.toLowerCase().includes(q) ||
        t.variables?.some((v) => v.toLowerCase().includes(q))
    );
  }, [templates, search]);

  const formVariables = extractVariables(formBody);

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-w-0 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            SMS Message Templates
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Pre-saved conversational replies, automated snippets, and parameterized SMS drafts.
          </p>
        </div>

        <Button
          size="sm"
          onClick={openCreate}
          className="h-9 gap-1.5 text-xs shadow-xs bg-primary text-primary-foreground font-medium"
        >
          <Plus className="h-4 w-4" />
          <span>New Template</span>
        </Button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-medium">
              Total Saved Templates
            </span>
            <p className="text-2xl font-bold tracking-tight">{templates.length}</p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-medium">
              With Dynamic Variables
            </span>
            <p className="text-2xl font-bold tracking-tight text-primary">
              {templates.filter((t) => (t.variables || []).length > 0).length}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-medium">
              Supported Variables
            </span>
            <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {"{name}"}, {"{date}"}, {"{order}"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search templates or variables..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-xs rounded-xl"
        />
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border border-dashed border-border/80 bg-muted/20">
          <CardContent className="py-16 text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-muted/80 text-muted-foreground flex items-center justify-center mx-auto">
              <LayoutTemplate className="h-7 w-7" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="font-semibold text-base">No templates found</h3>
              <p className="text-xs text-muted-foreground">
                {search
                  ? "No templates match your search."
                  : "Create standardized responses with variables like {firstName} to speed up messaging."}
              </p>
            </div>
            <Button size="sm" onClick={openCreate} className="text-xs gap-1.5 shadow-xs">
              <Plus className="h-4 w-4" /> Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((t) => {
            const isCopied = copiedId === t.id;
            const vars = t.variables || extractVariables(t.body);

            return (
              <Card
                key={t.id}
                className="border border-border/80 bg-card hover:border-primary/40 hover:shadow-md transition-all rounded-2xl overflow-hidden group flex flex-col justify-between"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-base text-foreground truncate">{t.name}</h3>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => copyTemplateBody(t.body, t.id)}
                        title="Copy template body"
                      >
                        {isCopied ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => openEdit(t)}
                        title="Edit template"
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleDelete(t.id)}
                        title="Delete template"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed bg-muted/20 p-3 rounded-xl border border-border/40 whitespace-pre-wrap font-sans">
                    {t.body}
                  </p>

                  {vars.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {vars.map((v) => (
                        <Badge
                          key={v}
                          variant="secondary"
                          className="text-[10px] px-2 py-0.5 font-mono text-primary bg-primary/10"
                        >
                          {`{${v}}`}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md p-6 space-y-4">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Template" : "New Message Template"}</DialogTitle>
            <DialogDescription className="text-xs">
              Use curly brackets like <span className="font-mono text-primary">{"{name}"}</span> to insert personalized variables.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Template Name</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Appointment Reminder"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Message Body</Label>
                <span className="text-[10px] text-muted-foreground">
                  {formBody.length} characters
                </span>
              </div>
              <Textarea
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                placeholder="Hi {firstName}, this is a reminder regarding your appointment tomorrow at {time}."
                rows={4}
                className="text-xs resize-none"
              />
            </div>

            {formVariables.length > 0 && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1">
                <span className="text-[11px] font-semibold text-primary flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Detected Variables:
                </span>
                <div className="flex flex-wrap gap-1">
                  {formVariables.map((v) => (
                    <Badge key={v} variant="outline" className="text-[10px] font-mono">
                      {`{${v}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowForm(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="text-xs bg-primary text-primary-foreground"
            >
              {saving ? "Saving..." : editing ? "Update Template" : "Save Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
