import { Info, Lightbulb, Sparkles, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { InlineContent } from "@/components/learning/inline-content";
import type { CalloutTone, InlineNode } from "@/types/content";
import { cn } from "@/lib/utils";

const TONES: Record<
  CalloutTone,
  { icon: LucideIcon; className: string; iconClass: string; defaultTitle: string }
> = {
  note: {
    icon: Info,
    className: "border-border bg-muted/40",
    iconClass: "text-muted-foreground",
    defaultTitle: "Note",
  },
  tip: {
    icon: Lightbulb,
    className: "border-ember-400/20 bg-ember-500/4",
    iconClass: "text-ember-300",
    defaultTitle: "Tip",
  },
  warning: {
    icon: TriangleAlert,
    className: "border-warning/30 bg-warning/6",
    iconClass: "text-warning",
    defaultTitle: "Watch out",
  },
  insight: {
    icon: Sparkles,
    className: "border-ember-500/30 bg-ember-500/6",
    iconClass: "text-ember-500",
    defaultTitle: "Key idea",
  },
};

export function Callout({
  tone,
  title,
  content,
}: {
  tone: CalloutTone;
  title?: string;
  content: InlineNode[];
}) {
  const config = TONES[tone];
  const Icon = config.icon;

  return (
    <aside className={cn("not-prose my-5 rounded-xl border p-4", config.className)}>
      <div className="flex items-center gap-2">
        <Icon className={cn("size-4 shrink-0", config.iconClass)} aria-hidden="true" />
        <p className="text-foreground text-xs font-semibold tracking-wide uppercase">
          {title ?? config.defaultTitle}
        </p>
      </div>
      <div className="text-muted-foreground mt-2 text-sm leading-relaxed">
        <InlineContent nodes={content} />
      </div>
    </aside>
  );
}
