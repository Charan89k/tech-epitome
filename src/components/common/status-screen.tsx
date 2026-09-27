import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { route } from "@/lib/utils";

type StatusScreenProps = {
  /** Large muted code, e.g. "404". Omit for non-HTTP states. */
  code?: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  primary?: { label: string; href: string };
  /** Rendered beside the primary action; typically a client retry button. */
  secondary?: React.ReactNode;
};

/**
 * Shared full-page state for 404, 401, 403 and unhandled errors.
 *
 * One component so every failure looks deliberate rather than like a
 * different bug each time, and so every one of them offers a way out.
 */
export function StatusScreen({
  code,
  title,
  description,
  icon: Icon,
  primary,
  secondary,
}: StatusScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-16 text-center">
      <div className="grid-backdrop pointer-events-none absolute inset-0 -z-10 opacity-40" />

      <Link href="/" aria-label="Tech Epitome home">
        <LogoMark gradient idSuffix="status" className="size-8" />
      </Link>

      {code && (
        <p className="text-muted-foreground/50 mt-8 font-mono text-5xl font-semibold tracking-tight tabular-nums">
          {code}
        </p>
      )}

      {Icon && !code && (
        <div className="bg-muted text-muted-foreground mt-8 rounded-lg p-3">
          <Icon className="size-6" aria-hidden="true" />
        </div>
      )}

      <h1 className="mt-4 text-xl font-semibold tracking-tight text-balance">
        {title}
      </h1>
      <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed text-pretty">
        {description}
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        {primary && (
          <Button asChild>
            <Link href={route(primary.href)}>{primary.label}</Link>
          </Button>
        )}
        {secondary}
      </div>
    </div>
  );
}
