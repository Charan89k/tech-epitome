"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  Blocks,
  BookOpen,
  GraduationCap,
  ListChecks,
  Loader2,
  Network,
  Search,
  Shapes,
} from "lucide-react";

import { searchAction } from "@/app/(shell)/search-action";
import type { SearchResult, SearchResultType } from "@/lib/search";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { primaryNav } from "@/lib/navigation";
import { route } from "@/lib/utils";

/**
 * Cmd/Ctrl+K palette.
 *
 * Navigates the static sections and searches published content — chapters,
 * patterns, problems, courses and the two design-exercise catalogues —
 * through the Postgres full-text service.
 *
 * Searching is debounced and runs in a transition, so typing never blocks
 * and a slow query cannot make the input stutter. The static nav is always
 * shown, because jumping to a known section should not require the network.
 */

const RESULT_ICON: Record<SearchResultType, typeof BookOpen> = {
  course: GraduationCap,
  chapter: BookOpen,
  pattern: Shapes,
  problem: ListChecks,
  "system-design": Network,
  lld: Blocks,
};

const RESULT_GROUP: Record<SearchResultType, string> = {
  course: "Courses",
  chapter: "Chapters",
  pattern: "Patterns",
  problem: "Problems",
  "system-design": "Design Exercises",
  lld: "LLD Exercises",
};

type CommandPaletteContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(
  null
);

export function useCommandPalette(): CommandPaletteContextValue {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error(
      "useCommandPalette must be used inside <CommandPaletteProvider>."
    );
  }
  return ctx;
}

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, startSearch] = useTransition();
  const router = useRouter();

  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "k" || !(event.metaKey || event.ctrlKey)) return;

      // Do not steal the shortcut from a focused text input or the editor.
      const target = event.target as HTMLElement | null;
      const inEditable =
        target?.isContentEditable === true ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "");
      if (inEditable) return;

      event.preventDefault();
      toggle();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  // Debounced content search. 200ms is long enough to skip most
  // intermediate keystrokes and short enough not to feel laggy.
  useEffect(() => {
    const trimmed = query.trim();
    if (!open || trimmed.length < 2) return;

    const timer = window.setTimeout(() => {
      startSearch(async () => {
        setResults(await searchAction(trimmed));
      });
    }, 200);

    return () => window.clearTimeout(timer);
  }, [query, open]);

  /**
   * Closing resets the query. Done in the handler rather than an effect:
   * clearing state in response to an event is an event handler's job, and
   * an effect would render the stale results once before wiping them.
   */
  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) {
      setQuery("");
      setResults([]);
    }
  }, []);

  const value = useMemo(
    () => ({ open, setOpen, toggle }),
    [open, toggle]
  );

  const grouped = useMemo(() => {
    // Derived, not stored: while the query is too short to search, any
    // results still in state belong to a previous query and must not show.
    const visible = query.trim().length >= 2 ? results : [];

    const groups = new Map<SearchResultType, SearchResult[]>();
    for (const result of visible) {
      const list = groups.get(result.type) ?? [];
      list.push(result);
      groups.set(result.type, list);
    }
    return [...groups.entries()];
  }, [results, query]);

  function go(href: string) {
    setOpen(false);
    router.push(route(href));
  }

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}

      <CommandDialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Search CodeForge"
        description="Jump to a section"
      >
        <CommandInput
          placeholder="Search chapters, patterns and problems…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {searching ? (
              <span className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                Searching…
              </span>
            ) : query.trim().length >= 2 ? (
              "Nothing matches that."
            ) : (
              "Type at least two characters to search."
            )}
          </CommandEmpty>

          {grouped.map(([type, items]) => {
            const Icon = RESULT_ICON[type];
            return (
              <CommandGroup key={type} heading={RESULT_GROUP[type]}>
                {items.map((result) => (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    value={`${result.type} ${result.title} ${result.description}`}
                    onSelect={() => go(result.href)}
                  >
                    <Icon className="text-muted-foreground size-4" />
                    <span className="truncate">{result.title}</span>
                    <span className="text-muted-foreground ml-auto hidden max-w-[16rem] truncate text-xs sm:inline">
                      {result.description}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}

          {primaryNav.map((group) => (
            <CommandGroup key={group.label} heading={group.label}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.href}
                  value={`${item.title} ${item.description ?? ""}`}
                  onSelect={() => go(item.href)}
                >
                  <item.icon className="text-muted-foreground size-4" />
                  <span>{item.title}</span>
                  {item.description && (
                    <span className="text-muted-foreground ml-auto hidden truncate text-xs sm:inline">
                      {item.description}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </CommandPaletteContext.Provider>
  );
}

/** The search affordance in the top bar. */
export function CommandPaletteTrigger() {
  const { setOpen } = useCommandPalette();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-keyshortcuts="Meta+K Control+K"
      className="text-muted-foreground hover:border-input hover:text-foreground bg-muted/40 border-border flex h-9 w-full max-w-64 items-center gap-2 rounded-md border px-3 text-sm transition-colors"
    >
      <Search className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">Search…</span>
      <kbd className="bg-background text-muted-foreground border-border ml-auto hidden rounded border px-1.5 py-0.5 font-mono text-[0.65rem] sm:inline">
        ⌘K
      </kbd>
    </button>
  );
}
