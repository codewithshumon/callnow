"use client";

import { ArrowLeft, Phone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Props { name: string; onCall: () => void; onDelete: () => void; }

export default function ThreadHeader({ name, onCall, onDelete }: Props) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2 border-b px-4 py-3">
      <Button variant="ghost" size="icon" onClick={() => router.push("/messages")} className="lg:hidden" aria-label="Back">
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <p className="flex-1 text-sm font-medium truncate">{name}</p>
      <Button variant="ghost" size="icon" onClick={onCall} aria-label="Call">
        <Phone className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete conversation">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}
