"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn, route } from "@/lib/utils";

export type FilterOption = { value: string; label: string; count: number };

type ProblemFiltersProps = {
  difficulty: FilterOption[];
  patterns: FilterOption[];
  topics: FilterOption[];
  showStatus: boolean;
};

const STATUS_OPTIONS: FilterOption[] = [
  { value: "SOLVED", label: "Solved", count: 0 },
  { value: "ATTEMPTED", label: "Attempted", count: 0 },
  { value: "NOT_STARTED", label: "Not started", count: 0 },
];

/**
 * Facet filters, driven entirely by the URL.
 *
 * Keeping state in searchParams rather than React state means a filtered view
 * is shareable, survives a refresh and works with the back button - and the
 * server component re-queries on navigation, so there is no client cache to
 * invalidate.
 */
export function ProblemFilters({
  difficulty,
  patterns,
  topics,
  showStatus,
}: ProblemFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const toggle = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = params.getAll(key);

      params.delete(key);
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      for (const v of next) params.append(key, v);

      // Any filter change invalidates the current page number.
      params.delete("page");

      startTransition(() => {
        router.push(route(`${pathname}?${params.toString()}`), { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  const clearAll = useCallback(() => {
    const params = new URLSearchParams();
    const search = searchParams.get("q");
    if (search) params.set("q", search);
    startTransition(() => {
      router.push(route(`${pathname}?${params.toString()}`), { scroll: false });
    });
  }, [pathname, router, searchParams]);

  const activeCount = ["difficulty", "pattern", "topic", "status"].reduce(
    (total, key) => total + searchParams.getAll(key).length,
    0
  );

  return (
    <div
      className={cn("space-y-6", pending && "pointer-events-none opacity-60")}
      aria-busy={pending}
    >
      {activeCount > 0 && (
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {activeCount} active
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-7 text-xs"
          >
            <X className="size-3" />
            Clear
          </Button>
        </div>
      )}

      <FilterGroup
        title="Difficulty"
        name="difficulty"
        options={difficulty}
        selected={searchParams.getAll("difficulty")}
        onToggle={toggle}
      />

      {showStatus && (
        <FilterGroup
          title="Status"
          name="status"
          options={STATUS_OPTIONS}
          selected={searchParams.getAll("status")}
          onToggle={toggle}
          hideCounts
        />
      )}

      <FilterGroup
        title="Pattern"
        name="pattern"
        options={patterns}
        selected={searchParams.getAll("pattern")}
        onToggle={toggle}
        scrollable
      />

      <FilterGroup
        title="Topic"
        name="topic"
        options={topics}
        selected={searchParams.getAll("topic")}
        onToggle={toggle}
        scrollable
      />
    </div>
  );
}

function FilterGroup({
  title,
  name,
  options,
  selected,
  onToggle,
  scrollable = false,
  hideCounts = false,
}: {
  title: string;
  name: string;
  options: FilterOption[];
  selected: string[];
  onToggle: (key: string, value: string) => void;
  scrollable?: boolean;
  hideCounts?: boolean;
}) {
  if (options.length === 0) return null;

  return (
    <fieldset>
      <legend className="text-muted-foreground mb-2.5 text-xs font-medium tracking-wider uppercase">
        {title}
      </legend>
      <div
        className={cn(
          "space-y-2",
          scrollable && options.length > 8 && "max-h-56 overflow-y-auto pr-1"
        )}
      >
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          return (
            <div key={option.value} className="flex items-center gap-2.5">
              <Checkbox
                id={id}
                checked={selected.includes(option.value)}
                onCheckedChange={() => onToggle(name, option.value)}
              />
              <Label
                htmlFor={id}
                className="flex flex-1 cursor-pointer items-center justify-between gap-2 text-sm font-normal"
              >
                <span className="truncate">{option.label}</span>
                {!hideCounts && (
                  <span className="text-muted-foreground tabular shrink-0 text-xs">
                    {option.count}
                  </span>
                )}
              </Label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
