"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Menu, Phone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import SidebarNav from "./SidebarNav";
import SidebarUser from "./SidebarUser";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Render nothing on auth pages (they have their own layout)
  if (
    !pathname?.startsWith("/messages") &&
    !pathname?.startsWith("/calls") &&
    !pathname?.startsWith("/dialer") &&
    !pathname?.startsWith("/numbers") &&
    !pathname?.startsWith("/contacts") &&
    !pathname?.startsWith("/billing") &&
    !pathname?.startsWith("/templates") &&
    !pathname?.startsWith("/settings") &&
    !pathname?.startsWith("/voicemails")
  ) {
    return null;
  }

  return (
    <>
      {/* Mobile hamburger button */}
      <div className="fixed left-3 top-3 z-50 lg:hidden">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="rounded-xl shadow-xs bg-background/90 backdrop-blur-xs"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile sidebar sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 pt-6">
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 px-5 pb-5 border-b">
              <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                <Phone className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight leading-tight">
                  VoiceLink
                </span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Telephony Cloud
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="border-t p-3 flex items-center justify-between gap-2 bg-muted/20">
              <div className="flex-1 min-w-0">
                <SidebarUser />
              </div>
              <ThemeToggle />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-72 border-r bg-card/60 backdrop-blur-md lg:flex lg:flex-col shadow-xs">
        {/* Brand header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/70">
          <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
            <Phone className="h-5 w-5" />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight leading-tight">
                VoiceLink
              </span>
              <span className="rounded-md bg-primary/10 text-primary px-1.5 py-0.2 text-[10px] font-semibold">
                PRO
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Telecom Cloud Active
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav />
        </div>

        {/* Footer with user & theme */}
        <div className="border-t border-border/70 p-3 flex items-center justify-between gap-2 bg-card/40">
          <div className="flex-1 min-w-0">
            <SidebarUser />
          </div>
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}
