"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import SidebarNav from "./SidebarNav";
import SidebarUser from "./SidebarUser";

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Render nothing on auth pages (they have their own layout)
  if (!pathname?.startsWith("/messages") && !pathname?.startsWith("/calls") && !pathname?.startsWith("/dialer") && !pathname?.startsWith("/numbers") && !pathname?.startsWith("/contacts") && !pathname?.startsWith("/billing") && !pathname?.startsWith("/templates") && !pathname?.startsWith("/settings") && !pathname?.startsWith("/voicemails")) {
    return null;
  }

  return (
    <>
      {/* Mobile hamburger */}
      <div className="fixed left-3 top-3 z-50 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile sidebar sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 pt-10">
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 px-4 py-3 font-semibold text-lg">
              <PhoneIcon />
              VoiceLink
            </div>
            <div className="flex-1 overflow-auto py-2">
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="border-t p-2">
              <SidebarUser />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-60 border-r bg-background lg:flex lg:flex-col">
        <div className="flex items-center gap-2 px-4 py-4 font-semibold text-lg">
          <PhoneIcon />
          VoiceLink
        </div>
        <div className="flex-1 overflow-auto py-2">
          <SidebarNav />
        </div>
        <div className="border-t p-2">
          <SidebarUser />
        </div>
      </aside>
    </>
  );
}

function PhoneIcon() {
  return (
    <svg
      className="h-5 w-5 text-primary"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
