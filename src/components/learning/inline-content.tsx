import Link from "next/link";

import type { InlineNode } from "@/types/content";
import { route } from "@/lib/utils";

/**
 * Renders a run of inline nodes.
 *
 * External links get rel="noopener noreferrer" automatically; internal ones
 * go through next/link so navigation stays client-side.
 */
export function InlineContent({ nodes }: { nodes: InlineNode[] }) {
  return (
    <>
      {nodes.map((node, index) => {
        switch (node.type) {
          case "text":
            return <span key={index}>{node.value}</span>;
          case "strong":
            return (
              <strong key={index} className="text-foreground font-semibold">
                {node.value}
              </strong>
            );
          case "em":
            return (
              <em key={index} className="italic">
                {node.value}
              </em>
            );
          case "code":
            return (
              <code
                key={index}
                className="bg-muted text-ember-300 rounded px-1.5 py-0.5 font-mono text-[0.85em]"
              >
                {node.value}
              </code>
            );
          case "link": {
            const external = /^https?:\/\//.test(node.href);
            if (external) {
              return (
                <a
                  key={index}
                  href={node.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ember-400 underline decoration-dotted underline-offset-4 hover:decoration-solid"
                >
                  {node.value}
                </a>
              );
            }
            return (
              <Link
                key={index}
                href={route(node.href)}
                className="text-ember-400 underline decoration-dotted underline-offset-4 hover:decoration-solid"
              >
                {node.value}
              </Link>
            );
          }
        }
      })}
    </>
  );
}
