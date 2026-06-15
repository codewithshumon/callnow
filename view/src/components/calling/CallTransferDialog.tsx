"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props { open: boolean; onClose: () => void; onTransfer: (number: string) => void; }

export default function CallTransferDialog({ open, onClose, onTransfer }: Props) {
  const [number, setNumber] = useState("");

  function handleTransfer() {
    if (!number || number.length < 6) { toast.error("Enter a valid number"); return; }
    onTransfer(number);
    onClose();
    toast.success("Call transferred");
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Transfer Call</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2"><Label>Transfer to</Label><Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="+14155551234" /></div>
          <Button className="w-full" onClick={handleTransfer}>Transfer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
