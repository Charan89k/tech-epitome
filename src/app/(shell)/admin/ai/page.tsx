import type { Metadata } from "next";
import { Sparkles } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { getAIUsage } from "@/services/admin";

export const metadata: Metadata = { title: "AI usage" };

function money(milliCents: number): string {
  return `$${(milliCents / 100_000).toFixed(2)}`;
}

/**
 * AI spend by feature.
 *
 * Aggregated, never per-learner. An operator needs to know what the free
 * AI features cost to run and whether anything is failing; reading an
 * individual's conversations is not an operational need, so the service
 * has no way to do it and this page could not render one if it tried.
 */
export default async function AdminAIPage() {
  const rows = await getAIUsage(30);
  const totals = rows.reduce(
    (acc, row) => ({
      calls: acc.calls + row.calls,
      cost: acc.cost + row.costMilliCents,
      failures: acc.failures + row.failures,
    }),
    { calls: 0, cost: 0, failures: 0 }
  );

  return (
    <div>
      <p className="text-muted-foreground text-sm leading-relaxed">
        The last 30 days, by feature. Nobody is charged for any of this —
        Tech Epitome is free. The ledger exists so the cost of running the free AI
        features is a measured number, and so a provider failing is visible.
      </p>

      {rows.length === 0 ? (
        <div className="bg-card border-border mt-4 rounded-xl border">
          <EmptyState
            icon={Sparkles}
            title="No AI calls in the last 30 days"
            description="Usage is recorded from the first call. Nothing has been spent."
          />
        </div>
      ) : (
        <div className="bg-card border-border mt-4 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[28rem] text-sm">
            <caption className="sr-only">
              AI calls, cost and failures by feature over the last 30 days
            </caption>
            <thead>
              <tr className="border-border text-muted-foreground bg-muted/20 border-b text-left text-xs">
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Feature
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Calls
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Cost
                </th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  Failures
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {rows.map((row) => (
                <tr key={row.feature} className="hover:bg-accent/25 transition-colors">
                  <td className="px-4 py-2.5 font-medium">{row.feature}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                    {row.calls}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                    {money(row.costMilliCents)}
                  </td>
                  <td
                    className={
                      row.failures > 0
                        ? "text-warning px-4 py-2.5 text-right font-mono tabular-nums"
                        : "px-4 py-2.5 text-right font-mono tabular-nums"
                    }
                  >
                    {row.failures}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-border bg-muted/20 border-t font-medium">
                <td className="px-4 py-2.5">Total</td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                  {totals.calls}
                </td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                  {money(totals.cost)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                  {totals.failures}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <p className="text-muted-foreground/70 mt-3 text-xs leading-relaxed">
        Cost is recorded per call in integer milli-cents; floats accumulate
        error across millions of rows. A zero cost means the provider in use
        does not report one — the local Ollama provider, for instance.
      </p>
    </div>
  );
}
