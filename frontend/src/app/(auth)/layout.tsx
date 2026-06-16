import type { ReactNode } from "react";
import Link from "next/link";
import { Phone } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2 font-semibold text-lg">
        <Phone className="h-5 w-5 text-primary" />
        VoiceLink
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
