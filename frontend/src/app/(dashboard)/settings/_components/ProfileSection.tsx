"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AvatarUpload from "@/components/shared/AvatarUpload";
import { useAuthStore } from "@/store/authStore";
import { put } from "@/lib/api";

export default function ProfileSection() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await put("/users/profile", { firstName, lastName, phone });
      if (user) setUser({ ...user, firstName, lastName, phone });
      toast.success("Profile updated");
    } catch { toast.error("Failed"); }
    finally { setSaving(false); }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <AvatarUpload src={user?.avatarUrl} fallback={(user?.email?.[0] || "U").toUpperCase()} onFile={() => {}} />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1"><Label>First Name</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
          <div className="space-y-1"><Label>Last Name</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
        </div>
        <div className="space-y-1"><Label>Email</Label><Input value={user?.email || ""} disabled className="opacity-60" /></div>
        <div className="space-y-1"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+14155551234" /></div>
        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Profile"}</Button>
      </CardContent>
    </Card>
  );
}
