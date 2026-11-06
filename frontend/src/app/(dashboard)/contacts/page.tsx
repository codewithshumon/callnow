"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Upload,
  Download,
  Search,
  Pencil,
  Trash2,
  Phone,
  MessageSquare,
  Users,
  Mail,
  Tag,
  Building,
  CheckCircle2,
  FileSpreadsheet,
  MoreVertical,
  X,
  PhoneCall,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getPaginated, post, put, del, postForm, extractApiError } from "@/lib/api";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import Papa from "papaparse";
import { cn } from "@/lib/utils";
import type { Contact } from "@/lib/types";

function formatPhone(num: string) {
  if (!num) return "";
  try {
    const parsed = parsePhoneNumberFromString(num);
    return parsed ? parsed.formatInternational() : num;
  } catch {
    return num;
  }
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formPhones, setFormPhones] = useState<
    Array<{ number: string; label: "mobile" | "work" | "home" | "other" }>
  >([{ number: "", label: "mobile" }]);

  const fetchContacts = useCallback(async () => {
    try {
      const params: Record<string, unknown> = { page: 1, limit: 100 };
      if (search.trim()) params.search = search.trim();
      const res = await getPaginated<Contact>("/contacts", params);
      setContacts(res.data || []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // All unique tags across contacts
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    contacts.forEach((c) => {
      c.tags?.forEach((t) => tags.add(t));
    });
    return Array.from(tags);
  }, [contacts]);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (selectedTag !== "all" && !c.tags?.includes(selectedTag)) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = c.name?.toLowerCase().includes(q);
        const matchesEmail = c.email?.toLowerCase().includes(q);
        const matchesNotes = c.notes?.toLowerCase().includes(q);
        const matchesPhone = c.phones?.some((p) => p.number.includes(q));
        const matchesTags = c.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesEmail && !matchesNotes && !matchesPhone && !matchesTags) {
          return false;
        }
      }
      return true;
    });
  }, [contacts, search, selectedTag]);

  function openEdit(c: Contact) {
    setEditing(c);
    setFormName(c.name);
    setFormEmail(c.email || "");
    setFormNotes(c.notes || "");
    setFormTags((c.tags || []).join(", "));
    setFormPhones(
      c.phones?.length
        ? c.phones.map((p) => ({ number: p.number, label: p.label }))
        : [{ number: "", label: "mobile" }]
    );
    setShowForm(true);
  }

  function openCreate() {
    setEditing(null);
    setFormName("");
    setFormEmail("");
    setFormNotes("");
    setFormTags("");
    setFormPhones([{ number: "", label: "mobile" }]);
    setShowForm(true);
  }

  async function handleSave() {
    if (!formName.trim()) {
      toast.error("Contact name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        email: formEmail.trim() || undefined,
        notes: formNotes.trim() || undefined,
        tags: formTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        phones: formPhones.filter((p) => p.number.trim()),
      };
      if (editing) {
        await put(`/contacts/${editing.id}`, payload);
      } else {
        await post("/contacts", payload);
      }
      toast.success(editing ? "Contact updated successfully" : "Contact created successfully");
      setShowForm(false);
      fetchContacts();
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    try {
      await del(`/contacts/${id}`);
      toast.success("Contact deleted");
      fetchContacts();
    } catch {
      toast.error("Failed to delete contact");
    }
  }

  // CSV Export
  const handleExportCsv = () => {
    if (contacts.length === 0) {
      toast.info("No contacts to export");
      return;
    }
    const headers = ["Name", "Primary Phone", "Email", "Tags", "Notes"];
    const rows = contacts.map((c) => [
      c.name,
      c.phones?.[0]?.number || "",
      c.email || "",
      (c.tags || []).join("; "),
      c.notes || "",
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `contacts-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${contacts.length} contacts`);
  };

  // CSV Import
  async function handleImport(file: File) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const fd = new FormData();
        fd.append("contacts", file);
        try {
          await postForm("/contacts/import", fd);
          toast.success(`Imported ${results.data.length} contacts successfully`);
          setShowImport(false);
          fetchContacts();
        } catch (err) {
          toast.error(extractApiError(err).message);
        }
      },
    });
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-w-0 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Contacts & Directory
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage your customer database, leads, phone tags, and 1-click communications.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={contacts.length === 0}
            className="h-9 gap-1.5 text-xs shadow-2xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImport(true)}
            className="h-9 gap-1.5 text-xs shadow-2xs"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Import CSV</span>
          </Button>

          <Button
            size="sm"
            onClick={openCreate}
            className="h-9 gap-1.5 text-xs shadow-xs bg-primary text-primary-foreground font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Add Contact</span>
          </Button>
        </div>
      </div>

      {/* Metric summary banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-medium">
              Total Contacts
            </span>
            <p className="text-2xl font-bold tracking-tight">{contacts.length}</p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-medium">
              With Phone Numbers
            </span>
            <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {contacts.filter((c) => c.phones?.length > 0).length}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-medium">
              With Email Addresses
            </span>
            <p className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
              {contacts.filter((c) => !!c.email).length}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground uppercase font-medium">
              Total Tags
            </span>
            <p className="text-2xl font-bold tracking-tight text-primary">
              {allTags.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, email, notes..."
            className="pl-9 h-9 text-xs rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Button
              variant={selectedTag === "all" ? "default" : "outline"}
              size="xs"
              onClick={() => setSelectedTag("all")}
              className="rounded-full text-xs"
            >
              All Tags
            </Button>
            {allTags.map((tag) => (
              <Button
                key={tag}
                variant={selectedTag === tag ? "default" : "outline"}
                size="xs"
                onClick={() => setSelectedTag(selectedTag === tag ? "all" : tag)}
                className="rounded-full text-xs capitalize"
              >
                {tag}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid View of Contacts */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredContacts.length === 0 ? (
        <Card className="border border-dashed border-border/80 bg-muted/20">
          <CardContent className="py-16 text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-muted/80 text-muted-foreground flex items-center justify-center mx-auto">
              <Users className="h-7 w-7" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="font-semibold text-base">No contacts found</h3>
              <p className="text-xs text-muted-foreground">
                {search || selectedTag !== "all"
                  ? "No contacts match your active search or tag filter."
                  : "Start populating your contacts directory to enable 1-click calling and SMS messaging."}
              </p>
            </div>
            <Button size="sm" onClick={openCreate} className="text-xs gap-1.5 shadow-xs">
              <Plus className="h-4 w-4" /> Create Contact
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredContacts.map((c) => {
            const primaryPhone = c.phones?.[0]?.number || "";
            const initials = c.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <Card
                key={c.id}
                className="border border-border/70 bg-card hover:border-primary/40 hover:shadow-md transition-all rounded-2xl overflow-hidden group flex flex-col justify-between"
              >
                <CardContent className="p-5 space-y-4">
                  {/* Top: Avatar, Name, Email, Edit/Delete */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-11 w-11 rounded-xl bg-primary/10 text-primary font-semibold shrink-0">
                        <AvatarFallback>{initials || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-base text-foreground truncate">
                          {c.name}
                        </h3>
                        {c.email ? (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{c.email}</span>
                          </p>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/60 italic">
                            No email provided
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => openEdit(c)}
                        title="Edit contact"
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleDelete(c.id)}
                        title="Delete contact"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* Phone list */}
                  <div className="space-y-1.5">
                    {c.phones && c.phones.length > 0 ? (
                      c.phones.map((p, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs bg-muted/30 px-2.5 py-1.5 rounded-lg border border-border/50"
                        >
                          <span className="font-mono font-medium text-foreground">
                            {formatPhone(p.number)}
                          </span>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {p.label}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground/60 italic px-1">
                        No phone number attached
                      </div>
                    )}
                  </div>

                  {/* Tags & Notes */}
                  {(c.tags?.length > 0 || c.notes) && (
                    <div className="space-y-2 pt-1">
                      {c.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {c.tags.map((t) => (
                            <Badge
                              key={t}
                              variant="secondary"
                              className="text-[10px] px-2 py-0.5 font-normal rounded-md"
                            >
                              #{t}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {c.notes && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 bg-muted/20 p-2 rounded-lg italic">
                          "{c.notes}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions Bar */}
                  {primaryPhone && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
                      <Link
                        href={`/calls/dialpad?to=${encodeURIComponent(primaryPhone)}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "w-full text-xs gap-1.5 hover:bg-primary hover:text-primary-foreground transition-all"
                        )}
                      >
                        <PhoneCall className="h-3.5 w-3.5" /> Call
                      </Link>
                      <Link
                        href={`/messages?to=${encodeURIComponent(primaryPhone)}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "w-full text-xs gap-1.5"
                        )}
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> SMS
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Contact Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md p-6 space-y-4">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Contact" : "Add New Contact"}</DialogTitle>
            <DialogDescription className="text-xs">
              Save contact details to match names in Call History and Quick-Dial.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label className="text-xs">Full Name *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. John Doe"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Email Address</Label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="e.g. john@example.com"
                className="text-xs"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Phone Numbers</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() =>
                    setFormPhones((prev) => [...prev, { number: "", label: "mobile" }])
                  }
                  className="text-[11px]"
                >
                  + Add Number
                </Button>
              </div>

              {formPhones.map((p, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Select
                    value={p.label}
                    onValueChange={(v) => {
                      const updated = [...formPhones];
                      updated[i].label = (v as any) || "mobile";
                      setFormPhones(updated);
                    }}
                  >
                    <SelectTrigger className="w-24 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mobile">Mobile</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="home">Home</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    value={p.number}
                    onChange={(e) => {
                      const u = [...formPhones];
                      u[i].number = e.target.value;
                      setFormPhones(u);
                    }}
                    placeholder="+14155551234"
                    className="flex-1 text-xs font-mono"
                  />

                  {formPhones.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() =>
                        setFormPhones((prev) => prev.filter((_, idx) => idx !== i))
                      }
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tags (comma-separated)</Label>
              <Input
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                placeholder="client, vip, lead, sales"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Internal Notes</Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Additional notes, client preference, or company info..."
                rows={3}
                className="text-xs resize-none"
              />
            </div>
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
              {saving ? "Saving..." : editing ? "Update Contact" : "Create Contact"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="sm:max-w-md p-6 space-y-4">
          <DialogHeader>
            <DialogTitle>Import Contacts from CSV</DialogTitle>
            <DialogDescription className="text-xs">
              Upload a standard `.csv` file with columns: <span className="font-mono">name, phone, email, tags, notes</span>.
            </DialogDescription>
          </DialogHeader>

          <div
            className="rounded-2xl border-2 border-dashed border-border/80 p-8 text-center cursor-pointer hover:border-primary/60 hover:bg-muted/30 transition-all"
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f) handleImport(f);
            }}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById("contact-csv-input")?.click()}
          >
            <FileSpreadsheet className="mx-auto h-10 w-10 text-primary mb-2" />
            <p className="text-sm font-semibold">Drop CSV file here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports CSV files exported from Google Contacts, Outlook, or custom lists.
            </p>
            <input
              id="contact-csv-input"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
