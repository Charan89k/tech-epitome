/**
 * The method, in one line under the auth card.
 *
 * Shows the product's actual thesis — pattern recognition — instead of stock
 * marketing copy, so the first thing a new user reads is what the platform
 * will teach them to do. Kept deliberately small: the form is the page.
 */
const STEPS = ["See", "Recognise", "Attempt", "Recall"] as const;

export function AuthAside() {
  return (
    <aside aria-label="The method" className="mt-8 w-full max-w-md text-center">
      <p className="text-foreground/90 text-sm font-medium text-balance">
        Stop memorising problems. Start recognising patterns.
      </p>
      <ol className="text-muted-foreground mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs">
        {STEPS.map((step, index) => (
          <li key={step} className="flex items-center gap-2">
            {index > 0 && (
              <span className="text-muted-foreground/40" aria-hidden="true">
                →
              </span>
            )}
            <span>
              <span className="text-ember-400 mr-1 font-mono tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              {step}
            </span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
