"use client";

import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FileUploadZone from "@/components/shared/FileUploadZone";
import { postForm } from "@/lib/api";
import Papa from "papaparse";

interface Props { open: boolean; onClose: () => void; onImported: () => void; }

export default function ContactImportDialog({ open, onClose, onImported }: Props) {
  async function handleFile(file: File) {
    Papa.parse(file, { header: true, skipEmptyLines: true, complete: async (results) => {
      const fd = new FormData(); fd.append("contacts", file);
      try { await postForm("/contacts/import", fd); toast.success(`Imported ${results.data.length} contacts`); onImported(); onClose(); }
      catch { toast.error("Import failed"); }
    }});
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Import Contacts</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Upload a CSV with columns: name, phone, email, notes, tags</p>
        <FileUploadZone accept=".csv" maxSizeMB={10} onFile={handleFile} />
      </DialogContent>
    </Dialog>
  );
}
