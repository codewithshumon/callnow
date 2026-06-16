"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CopyButton from "@/components/shared/CopyButton";
import { get, post, del } from "@/lib/api";
import type { ApiKey } from "@/lib/types";

export default function ApiKeySection() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function loadKeys() {
    try { const r = await get<ApiKey[]>("/api-keys"); setKeys((r.data as any) || []); } catch {}
  }

  useState(() => { loadKeys(); });

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await post<{ plaintext: string; key: ApiKey }>("/api-keys", { name: "Default", scopes: ["sms:send", "calls:read"] });
      setNewKey((res.data as any)?.plaintext || "");
      loadKeys();
    } catch { toast.error("Failed to create key"); }
    finally { setCreating(false); }
  }

  async function handleRevoke(id: string) {
    try { await del(`/api-keys/${id}`); loadKeys(); toast.success("Key revoked"); } catch { toast.error("Failed"); }
  }

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> API Keys</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {keys.map((k) => (
          <div key={k.id} className="flex items-center justify-between rounded border px-3 py-2">
            <div><p className="text-sm font-mono">{k.keyPrefix}...</p><p className="text-xs text-muted-foreground">Created {new Date(k.createdAt).toLocaleDateString()}</p></div>
            <Button variant="ghost" size="sm" onClick={() => handleRevoke(k.id)} className="text-destructive">Revoke</Button>
          </div>
        ))}
        {newKey && (
          <div className="rounded-lg border border-yellow-500 bg-yellow-50 p-3 dark:bg-yellow-950/20">
            <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">Copy this key now — it won&apos;t be shown again!</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-background px-2 py-1 text-xs break-all">{newKey}</code>
              <CopyButton text={newKey} />
            </div>
          </div>
        )}
        <Button variant="outline" size="sm" onClick={handleCreate} disabled={creating}>{creating ? "Creating..." : "Create API Key"}</Button>
      </CardContent>
    </Card>
  );
}
