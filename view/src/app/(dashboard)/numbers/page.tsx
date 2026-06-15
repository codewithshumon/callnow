"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { get, del } from "@/lib/api";
import type { PhoneNumber } from "@/lib/types";
import AddNumberDialog from "./_components/AddNumberDialog";

export default function NumbersPage() {
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [releasing, setReleasing] = useState<string | null>(null);

  const fetchNumbers = useCallback(async () => {
    try {
      const res = await get<PhoneNumber[]>("/numbers");
      setNumbers((res.data as any) || []);
    } catch { /* empty */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNumbers(); }, [fetchNumbers]);

  async function handleRelease(id: string, num: string) {
    if (!confirm(`Release ${num}? You will no longer receive calls or messages to this number.`)) return;
    setReleasing(id);
    try {
      await del(`/numbers/${id}`);
      setNumbers((prev) => prev.filter((n) => n.id !== id));
      toast.success(`Number ${num} released.`);
    } catch {
      toast.error("Failed to release number.");
    } finally {
      setReleasing(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">My Numbers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {numbers.filter((n) => n.status === "active").length} active
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="mr-1 h-4 w-4" /> Add Number
        </Button>
      </div>

      {numbers.length === 0 && (
        <div className="py-16 text-center text-sm text-muted-foreground">
          You don&apos;t have any numbers yet. Get your first number to start calling and messaging.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {numbers.map((num) => (
          <Card key={num.id} className={num.status !== "active" ? "opacity-60" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-mono font-medium">{num.number}</p>
                  {num.friendlyName && <p className="text-sm text-muted-foreground">{num.friendlyName}</p>}
                </div>
                <Badge variant={num.status === "active" ? "default" : "secondary"} className="text-[10px]">
                  {num.status}
                </Badge>
              </div>
              <div className="flex items-center gap-1 mt-2">
                {num.capabilities.voice && <Badge variant="outline" className="text-[10px]">Voice ✓</Badge>}
                {num.capabilities.sms && <Badge variant="outline" className="text-[10px]">SMS ✓</Badge>}
                {num.capabilities.mms ? <Badge variant="outline" className="text-[10px]">MMS ✓</Badge> : <Badge variant="outline" className="text-[10px] text-muted-foreground">MMS ✗</Badge>}
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-muted-foreground">{num.provider} · ${num.monthlyCost}/mo</span>
                {num.status === "active" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRelease(num.id, num.number)}
                    disabled={releasing === num.id}
                    className="text-destructive hover:text-destructive h-auto p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddNumberDialog open={showAdd} onClose={() => setShowAdd(false)} onAdded={fetchNumbers} />
    </div>
  );
}
