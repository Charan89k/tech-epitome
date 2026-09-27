"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { route } from "@/lib/utils";

/**
 * Search box for the problem list.
 *
 * Debounced so typing does not fire a navigation per keystroke, and kept in
 * the URL so a search is shareable and survives a refresh.
 */
export function ProblemSearch({ initialValue }: { initialValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialValue);
  const [syncedValue, setSyncedValue] = useState(initialValue);
  const [, startTransition] = useTransition();

  // Keep in step when the URL changes from elsewhere - the back button, or
  // the Clear button in the filter panel. Adjusting state during render is
  // React's documented way to react to a changed prop; doing it in an effect
  // renders the stale value once first and triggers a cascading re-render.
  if (initialValue !== syncedValue) {
    setSyncedValue(initialValue);
    setValue(initialValue);
  }

  useEffect(() => {
    if (value === initialValue) return;

    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }
      params.delete("page");
      startTransition(() => {
        router.push(route(`${pathname}?${params.toString()}`), { scroll: false });
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [value, initialValue, pathname, router, searchParams]);

  return (
    <div className="relative">
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search problems…"
        aria-label="Search problems"
        className="pl-9"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Clear search"
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded p-1"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
