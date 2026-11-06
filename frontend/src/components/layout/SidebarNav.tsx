"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  Phone,
  PhoneCall,
  Hash,
  Users,
  CreditCard,
  Settings,
  Voicemail,
  LayoutTemplate,
  Radio,
  Zap,
} from "lucide-react";

const navSections = [
  {
    title: "Communications",
    items: [
      { href: "/messages", label: "Messages & SMS", icon: MessageSquare },
      { href: "/calls", label: "Calls & Logs", icon: Phone },
      { href: "/calls/dialpad", label: "Web Dialpad", icon: PhoneCall },
      { href: "/dialer", label: "Power Dialer", icon: Zap },
      { href: "/voicemails", label: "Voicemails", icon: Voicemail },
    ],
  },
  {
    title: "Management",
    items: [
      { href: "/numbers", label: "Phone Numbers", icon: Hash },
      { href: "/contacts", label: "Contacts & Leads", icon: Users },
      { href: "/templates", label: "Message Templates", icon: LayoutTemplate },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/billing", label: "Billing & Plans", icon: CreditCard },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export default function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-5 px-3">
      {navSections.map((section) => (
        <div key={section.title} className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {section.title}
            </p>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const isActive =
                item.href === "/calls"
                  ? pathname === "/calls"
                  : pathname === item.href ||
                    pathname?.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition-all group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    collapsed && "justify-center px-2"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                      isActive
                        ? "text-primary-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
