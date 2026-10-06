"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

/** Dark/light switch, shared by the app header and the marketing header. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme !== "light";
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-9"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {/* Both icons render; CSS picks one, so the server and client agree. */}
      <Moon className="hidden size-4 dark:block" aria-hidden="true" />
      <Sun className="block size-4 dark:hidden" aria-hidden="true" />
    </Button>
  );
}
