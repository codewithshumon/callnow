"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mobile top bar — shown only on mobile to identify current page
const pageTitles: Record<string, string> = {
  "/messages": "Messages",
  "/calls": "Calls",
  "/dialer": "Dialer",
  "/numbers": "Numbers",
  "/contacts": "Contacts",
  "/billing": "Billing",
  "/templates": "Templates",
  "/voicemails": "Voicemails",
  "/settings": "Settings",
};

function getPageTitle(pathname: string | null): string {
  if (!pathname) return "";
  // Direct match or prefix match
  for (const [path, title] of Object.entries(pageTitles)) {
    if (pathname === path || pathname.startsWith(path + "/")) {
      return title;
    }
  }
  return "";
}

export default function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <div className="flex items-center gap-3 border-b bg-background px-4 py-3 lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="-ml-1"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <h1 className="text-lg font-semibold">{title}</h1>
    </div>
  );
}
