"use client";

import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon, Sun, Moon, Laptop, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/authStore";
import { post } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function SidebarUser({ collapsed }: { collapsed?: boolean }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  async function handleLogout() {
    try {
      await post("/auth/logout", {});
    } catch {}
    logout();
    router.push("/login");
  }

  const initials = user?.email?.[0]?.toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-accent/80 active:bg-accent cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-ring select-none",
          collapsed && "justify-center px-2"
        )}
      >
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold leading-none text-foreground">
              {user?.email || "User"}
            </p>
          </div>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-60 shadow-xl border border-border/80 p-1.5 rounded-xl">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-0.5 py-1">
              <span className="text-[11px] text-muted-foreground font-normal">Signed in as</span>
              <span className="text-sm font-semibold truncate text-foreground">{user?.email || "User"}</span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem
          onClick={() => router.push("/settings")}
          className="cursor-pointer py-2"
        >
          <UserIcon className="mr-2 h-4 w-4" />
          <span>Profile & Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuLabel className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider px-2 py-1">
          Theme
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer py-1.5">
          <Sun className="mr-2 h-4 w-4" />
          Light
          {theme === "light" && <Check className="ml-auto h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer py-1.5">
          <Moon className="mr-2 h-4 w-4" />
          Dark
          {theme === "dark" && <Check className="ml-auto h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer py-1.5">
          <Laptop className="mr-2 h-4 w-4" />
          System
          {theme === "system" && <Check className="ml-auto h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer py-2 text-red-600 dark:text-red-400 focus:bg-red-500/10 focus:text-red-600 font-semibold"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
