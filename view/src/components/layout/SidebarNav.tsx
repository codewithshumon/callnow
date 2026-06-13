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
} from "lucide-react";

const navItems = [
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/calls", label: "Calls", icon: Phone },
  { href: "/dialer", label: "Dialer", icon: PhoneCall },
  { href: "/numbers", label: "Numbers", icon: Hash },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void; // close mobile sheet on navigation
}

export default function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-2">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          pathname?.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
