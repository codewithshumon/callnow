"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  variant?: "dropdown" | "button";
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({
  variant = "dropdown",
  className,
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-9 w-9 text-muted-foreground", className)}
        aria-label="Toggle theme"
        disabled
      >
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  if (variant === "button") {
    const isDark = resolvedTheme === "dark";
    return (
      <Button
        variant="ghost"
        size={showLabel ? "default" : "icon"}
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={cn("text-muted-foreground hover:text-foreground", className)}
        aria-label="Toggle theme"
      >
        {isDark ? (
          <Sun className="h-4 w-4 transition-transform hover:rotate-45" />
        ) : (
          <Moon className="h-4 w-4 transition-transform hover:-rotate-12" />
        )}
        {showLabel && (
          <span className="ml-2 text-sm">
            {isDark ? "Light mode" : "Dark mode"}
          </span>
        )}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center justify-center rounded-lg h-9 w-9 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors outline-none cursor-pointer",
          className
        )}
        aria-label="Toggle theme"
      >
        {resolvedTheme === "dark" ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")} className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            <span>Light</span>
          </div>
          {theme === "light" && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            <span>Dark</span>
          </div>
          {theme === "dark" && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2">
            <Laptop className="h-4 w-4" />
            <span>System</span>
          </div>
          {theme === "system" && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
