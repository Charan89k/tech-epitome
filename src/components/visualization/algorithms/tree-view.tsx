/** A binary tree drawn from an array of nodes laid out by depth and order. */
export type TreeNode = {
  id: number;
  label: string;
  x: number;
  depth: number;
  parent: number | null;
};

export function TreeView({
  nodes,
  active,
  visited = [],
}: {
  nodes: readonly TreeNode[];
  active?: number | null;
  visited?: readonly number[];
}) {
  const depth = Math.max(0, ...nodes.map((n) => n.depth));
  const height = (depth + 1) * 18 + 4;
  const yOf = (d: number) => d * 18 + 10;
  const byId = new Map(nodes.map((n) => [n.id, n]));

  return (
    <svg
      viewBox={`0 0 100 ${height}`}
      className="h-auto w-full"
      style={{ maxHeight: height * 3.2 }}
      role="img"
      aria-label={`Tree with ${nodes.length} nodes`}
    >
      {nodes.map((n) => {
        const parent = n.parent === null ? undefined : byId.get(n.parent);
        return parent ? (
          <line
            key={`edge-${n.id}`}
            x1={parent.x}
            y1={yOf(parent.depth)}
            x2={n.x}
            y2={yOf(n.depth)}
            className="stroke-border"
            strokeWidth={0.4}
          />
        ) : null;
      })}
      {nodes.map((n) => {
        const isActive = n.id === active;
        const isVisited = visited.includes(n.id);
        return (
          <g key={n.id}>
            <circle
              cx={n.x}
              cy={yOf(n.depth)}
              r={4.6}
              strokeWidth={0.5}
              className={
                isActive
                  ? "fill-viz-compare/20 stroke-viz-compare"
                  : isVisited
                    ? "fill-brand-500/15 stroke-brand-400"
                    : "fill-card stroke-border"
              }
            />
            <text
              x={n.x}
              y={yOf(n.depth) + 1.3}
              textAnchor="middle"
              className="fill-foreground font-mono"
              fontSize={3.6}
            >
              {n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
