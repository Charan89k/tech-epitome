import Link from "next/link";

import {
  DesignThumb,
  type DesignThumbKind,
} from "@/components/system-design/design-thumb";
import { route } from "@/lib/utils";

/**
 * Small pieces shared by the design catalogues (system design, LLD,
 * preparation): the wide feature link with a thumbnail, and the numbered
 * "how it works" strip.
 */

export function FeatureLink({
  href,
  title,
  description,
  thumb,
}: {
  href: string;
  title: string;
  description: string;
  thumb: DesignThumbKind;
}) {
  return (
    <Link
      href={route(href)}
      className="group flex overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-ember-500/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <DesignThumb
        kind={thumb}
        className="h-24 w-32 shrink-0 border-r border-border sm:w-40"
      />
      <div className="min-w-0 flex-1 p-4">
        <h2 className="font-semibold transition-colors group-hover:text-ember-200">
          {title}
        </h2>
        <p className="mt-1 line-clamp-2 text-sm leading-snug text-muted-foreground">
          {description}
        </p>
      </div>
    </Link>
  );
}

export function HowItWorks({ steps }: { steps: string[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 rounded-xl border border-border bg-card p-2 text-xs">
      {steps.map((step, index) => (
        <li key={step} className="flex items-center gap-2">
          {index > 0 && (
            <span className="hidden h-px w-6 bg-border sm:block" aria-hidden="true" />
          )}
          <span className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-ember-500/15 font-mono text-[0.65rem] font-semibold text-ember-300">
              {index + 1}
            </span>
            {step}
          </span>
        </li>
      ))}
    </ol>
  );
}
