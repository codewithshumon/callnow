"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  src?: string;
  fallback: string;
  onFile: (file: File) => void;
  size?: "sm" | "md" | "lg";
}

const sizeMap = { sm: "h-12 w-12", md: "h-20 w-20", lg: "h-28 w-28" };

export default function AvatarUpload({ src, fallback, onFile, size = "md" }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onFile(file);
  }

  return (
    <div className="relative inline-block cursor-pointer" onClick={() => inputRef.current?.click()}>
      <Avatar className={cn(sizeMap[size], "ring-2 ring-border hover:ring-primary transition-colors")}>
        <AvatarImage src={preview || src || ""} />
        <AvatarFallback className="text-lg">{fallback}</AvatarFallback>
      </Avatar>
      <div className="absolute bottom-0 right-0 rounded-full bg-primary p-1 text-primary-foreground">
        <Camera className="h-3 w-3" />
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
