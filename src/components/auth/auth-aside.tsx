import Link from "next/link";

import { Logo } from "@/components/brand/logo";

/**
 * The brand panel beside the auth form.
 *
 * Shows the product's actual thesis - pattern recognition - instead of stock
 * marketing copy, so the first thing a new user reads is what the platform
 * will teach them to do.
 */
export function AuthAside() {
  return (
    <aside className="bg-sidebar border-sidebar-border relative hidden flex-col justify-between border-r p-10 lg:flex">
      <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-60" />

      <Link href="/" className="relative">
        <Logo idSuffix="auth-aside" wordmarkClassName="text-base" />
      </Link>

      <div className="relative max-w-md">
        <p className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
          The method
        </p>
        <h2 className="text-foreground mt-4 text-2xl leading-snug font-semibold tracking-tight text-balance">
          Stop memorising problems. Start recognising patterns.
        </h2>
        <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
          Every chapter ends with the same question an interviewer is really
          asking: <em>what shape is this problem?</em> CodeForge trains the
          recognition step first, then the code.
        </p>

        <ol className="mt-8 space-y-3">
          {[
            { step: "See", detail: "A worked example, stepped frame by frame" },
            { step: "Recognise", detail: "The clues that name the pattern" },
            { step: "Attempt", detail: "A guided problem, then an unguided one" },
            { step: "Recall", detail: "Spaced revision before you forget it" },
          ].map((row, index) => (
            <li key={row.step} className="flex items-baseline gap-3 text-sm">
              <span className="text-ember-500/70 w-4 shrink-0 font-mono text-xs tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-foreground w-24 shrink-0 font-medium">
                {row.step}
              </span>
              <span className="text-muted-foreground">{row.detail}</span>
            </li>
          ))}
        </ol>
      </div>

      <p className="text-muted-foreground/70 relative text-xs">
        Built for people who want to understand, not just pass.
      </p>
    </aside>
  );
}
