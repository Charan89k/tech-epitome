"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const OPTIONS = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
] as const;

/**
 * Light, dark or follow the system, shared by the app and marketing headers.
 * next-themes persists the choice and applies it before first paint.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* Fixed label and both icons in the markup (CSS picks one): the
            theme is unknown on the server, so nothing here may depend on it. */}
        <Button
          variant="ghost"
          size="icon"
          className="size-9"
          aria-label="Colour theme"
        >
          <Moon className="hidden size-4 dark:block" aria-hidden="true" />
          <Sun className="block size-4 dark:hidden" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      {/* Content mounts only when opened, after hydration, so it can show
          the stored choice. */}
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel className="text-xs font-normal text-subtle-foreground">
          Theme
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={setTheme}>
          {OPTIONS.map(({ value, label, Icon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
