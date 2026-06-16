"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { del } from "@/lib/api";

export default function DangerZone() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [confirm, setConfirm] = useState("");

  async function handleDelete() {
    if (confirm !== user?.email) { toast.error("Type your email to confirm"); return; }
    try { await del("/users/me"); toast.success("Account deleted."); logout(); router.push("/"); }
    catch { toast.error("Failed to delete account"); }
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader><CardTitle className="text-destructive flex items-center gap-2"><Trash2 className="h-5 w-5" /> Danger Zone</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Permanently delete your account and all data. This action cannot be undone.</p>
        <div className="space-y-1"><Label>Type your email to confirm: {user?.email}</Label><Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={user?.email} /></div>
        <Button variant="destructive" onClick={handleDelete} disabled={confirm !== user?.email}>Delete My Account</Button>
      </CardContent>
    </Card>
  );
}
