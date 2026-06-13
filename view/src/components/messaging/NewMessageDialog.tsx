"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { post, extractApiError } from "@/lib/api";
import type { PhoneNumber } from "@/lib/types";

interface NewMessageDialogProps {
  open: boolean;
  onClose: () => void;
  userNumbers: PhoneNumber[];
}

export default function NewMessageDialog({
  open,
  onClose,
  userNumbers,
}: NewMessageDialogProps) {
  const router = useRouter();
  const [fromNumber, setFromNumber] = useState("");
  const [toNumber, setToNumber] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  const smsNumbers = userNumbers.filter((n) => n.capabilities.sms && n.status === "active");

  async function handleSend() {
    if (!fromNumber) { toast.error("Select a number to send from"); return; }
    if (!toNumber || toNumber.length < 8) { toast.error("Enter a valid phone number"); return; }
    if (!body.trim()) { toast.error("Type a message"); return; }

    setIsSending(true);
    try {
      const res = await post<{ conversationId: string }>("/messages", {
        fromNumber,
        toNumber,
        body: body.trim(),
      });
      toast.success("Message sent!");
      onClose();
      router.push(`/messages/${res.data.conversationId}`);
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>From</Label>
            <Select value={fromNumber} onValueChange={(v) => setFromNumber(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select your number" />
              </SelectTrigger>
              <SelectContent>
                {smsNumbers.map((n) => (
                  <SelectItem key={n.id} value={n.number}>
                    {n.number} {n.friendlyName ? `(${n.friendlyName})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nm-to">To</Label>
            <input
              id="nm-to"
              type="tel"
              placeholder="+14155551234"
              value={toNumber}
              onChange={(e) => setToNumber(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nm-body">Message</Label>
            <Textarea
              id="nm-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message..."
              rows={4}
              maxLength={1600}
            />
            <p className="text-right text-xs text-muted-foreground">
              {body.length}/1600
            </p>
          </div>
          <Button className="w-full" onClick={handleSend} disabled={isSending}>
            {isSending ? "Sending..." : "Send Message"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
