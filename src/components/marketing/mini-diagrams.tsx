import { cn } from "@/lib/utils";

/**
 * Small line-art diagrams used as card thumbnails: an array with two
 * pointers, a linked list, a sliding window, a tree.
 *
 * Drawn in the visualization palette on the dark `viz-canvas` panel — the
 * same vocabulary as the live visualizer, so a thumbnail promises exactly
 * the kind of picture the page behind it delivers. Pure SVG, no data.
 */

export type MiniDiagramKind =
  | "pointers"
  | "list"
  | "window"
  | "tree"
  | "grid"
  | "stack"
  | "architecture"
  | "classes"
  | "schedule";

export function MiniDiagram({
  kind,
  className,
}: {
  kind: MiniDiagramKind;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "viz-canvas flex items-center justify-center overflow-hidden",
        className
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 160 90" className="h-full w-full max-w-[16rem]" fill="none">
        {kind === "pointers" && <Pointers />}
        {kind === "list" && <ListArt />}
        {kind === "window" && <WindowArt />}
        {kind === "tree" && <TreeArt />}
        {kind === "grid" && <GridArt />}
        {kind === "stack" && <StackArt />}
        {kind === "architecture" && <ArchitectureArt />}
        {kind === "classes" && <ClassesArt />}
        {kind === "schedule" && <ScheduleArt />}
      </svg>
    </div>
  );
}

const CELL = "var(--viz-compare)";
const ACTIVE = "var(--ember-500)";
const DONE = "var(--viz-done)";
const TEXT = "var(--foreground)";

function Cells({
  y,
  values,
  active = [] as number[],
  x0 = 20,
}: {
  y: number;
  values: number[];
  active?: number[];
  x0?: number;
}) {
  return (
    <>
      {values.map((v, i) => (
        <g key={i}>
          <rect
            x={x0 + i * 20}
            y={y}
            width="18"
            height="18"
            rx="3"
            stroke={active.includes(i) ? ACTIVE : CELL}
            strokeWidth="1.2"
            fill={
              active.includes(i)
                ? "color-mix(in oklch, var(--ember-500) 22%, transparent)"
                : "transparent"
            }
          />
          <text
            x={x0 + i * 20 + 9}
            y={y + 13}
            fontSize="9"
            textAnchor="middle"
            fill={TEXT}
            fontFamily="monospace"
          >
            {v}
          </text>
        </g>
      ))}
    </>
  );
}

function Pointers() {
  return (
    <>
      <Cells y={30} values={[1, 2, 3, 4, 5, 6]} active={[0, 5]} />
      <path d="M29 56v10M24 61l5-5 5 5" stroke={ACTIVE} strokeWidth="1.2" />
      <path d="M129 56v10M124 61l5-5 5 5" stroke={ACTIVE} strokeWidth="1.2" />
      <text
        x="29"
        y="78"
        fontSize="8"
        textAnchor="middle"
        fill={ACTIVE}
        fontFamily="monospace"
      >
        left
      </text>
      <text
        x="129"
        y="78"
        fontSize="8"
        textAnchor="middle"
        fill={ACTIVE}
        fontFamily="monospace"
      >
        right
      </text>
    </>
  );
}

function ListArt() {
  const xs = [14, 54, 94];
  return (
    <>
      {xs.map((x, i) => (
        <g key={x}>
          <rect
            x={x}
            y="34"
            width="26"
            height="20"
            rx="5"
            stroke={i === 1 ? ACTIVE : CELL}
            strokeWidth="1.2"
          />
          <text
            x={x + 13}
            y="48"
            fontSize="9"
            textAnchor="middle"
            fill={TEXT}
            fontFamily="monospace"
          >
            {i + 1}
          </text>
          <path
            d={`M${x + 28} 44h10M${x + 34} 40l4 4-4 4`}
            stroke="var(--muted-foreground)"
            strokeWidth="1.2"
          />
        </g>
      ))}
      <text
        x="140"
        y="47"
        fontSize="8"
        fill="var(--muted-foreground)"
        fontFamily="monospace"
      >
        null
      </text>
      <text
        x="67"
        y="68"
        fontSize="8"
        textAnchor="middle"
        fill={ACTIVE}
        fontFamily="monospace"
      >
        ▲ curr
      </text>
    </>
  );
}

function WindowArt() {
  return (
    <>
      <Cells y={30} values={[2, 1, 5, 1, 3, 2]} />
      <rect
        x="57"
        y="26"
        width="64"
        height="26"
        rx="5"
        stroke={ACTIVE}
        strokeWidth="1.4"
        strokeDasharray="4 3"
      />
      <text
        x="89"
        y="68"
        fontSize="8"
        textAnchor="middle"
        fill={ACTIVE}
        fontFamily="monospace"
      >
        window k=3
      </text>
    </>
  );
}

function TreeArt() {
  const nodes = [
    [80, 18, ACTIVE],
    [48, 46, DONE],
    [112, 46, CELL],
    [32, 74, DONE],
    [64, 74, CELL],
  ] as const;
  return (
    <>
      <path
        d="M80 18L48 46M80 18l32 28M48 46L32 74M48 46l16 28"
        stroke="var(--muted-foreground)"
        strokeWidth="1"
      />
      {nodes.map(([x, y, c], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r="9"
          stroke={c}
          strokeWidth="1.3"
          fill="var(--background)"
        />
      ))}
    </>
  );
}

function GridArt() {
  return (
    <>
      {[0, 1, 2].map((r) => (
        <Cells
          key={r}
          y={14 + r * 22}
          x0={40}
          values={[r, r + 1, r + 2, r + 3]}
          active={r === 1 ? [2] : []}
        />
      ))}
    </>
  );
}

function StackArt() {
  return (
    <>
      <path d="M58 16v60h44V16" stroke="var(--muted-foreground)" strokeWidth="1.3" />
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x="62"
          y={54 - i * 18}
          width="36"
          height="15"
          rx="3"
          stroke={i === 2 ? ACTIVE : CELL}
          strokeWidth="1.2"
        />
      ))}
      <text x="108" y="25" fontSize="8" fill={ACTIVE} fontFamily="monospace">
        ◀ top
      </text>
    </>
  );
}

const MUTED = "var(--muted-foreground)";

/** Clients → load balancer → servers → database: the system design shape. */
function ArchitectureArt() {
  return (
    <>
      {[24, 50].map((y) => (
        <g key={y}>
          <rect
            x="8"
            y={y}
            width="20"
            height="13"
            rx="2"
            stroke={CELL}
            strokeWidth="1.2"
          />
          <path d={`M5 ${y + 16}h26`} stroke={CELL} strokeWidth="1.2" />
        </g>
      ))}
      <path d="M33 31l17 11M33 57l17-11" stroke={MUTED} strokeWidth="1" />
      <rect
        x="52"
        y="36"
        width="18"
        height="18"
        rx="3"
        stroke={ACTIVE}
        strokeWidth="1.3"
        fill="color-mix(in oklch, var(--ember-500) 18%, transparent)"
      />
      <text
        x="61"
        y="64"
        fontSize="6.5"
        textAnchor="middle"
        fill={ACTIVE}
        fontFamily="monospace"
      >
        LB
      </text>
      <path d="M72 45l14-17M72 45h14M72 45l14 17" stroke={MUTED} strokeWidth="1" />
      {[20, 39, 58].map((y) => (
        <g key={y}>
          <rect
            x="88"
            y={y}
            width="24"
            height="12"
            rx="2"
            stroke={CELL}
            strokeWidth="1.2"
          />
          <circle cx="93" cy={y + 6} r="1.3" fill={DONE} />
        </g>
      ))}
      <path d="M114 45h14" stroke={MUTED} strokeWidth="1" />
      <path
        d="M131 35v20c0 2.5 5 4 10.5 4s10.5-1.5 10.5-4V35"
        stroke={CELL}
        strokeWidth="1.2"
      />
      <ellipse cx="141.5" cy="35" rx="10.5" ry="4" stroke={CELL} strokeWidth="1.2" />
      <text
        x="141.5"
        y="70"
        fontSize="6.5"
        textAnchor="middle"
        fill={MUTED}
        fontFamily="monospace"
      >
        db
      </text>
    </>
  );
}

/** An interface and two implementations: the low-level design shape. */
function ClassesArt() {
  const box = (x: number, y: number, title: string, active = false) => (
    <g>
      <rect
        x={x}
        y={y}
        width="46"
        height="28"
        rx="3"
        stroke={active ? ACTIVE : CELL}
        strokeWidth="1.2"
      />
      <path d={`M${x} ${y + 10}h46`} stroke={active ? ACTIVE : CELL} strokeWidth="1" />
      <text
        x={x + 23}
        y={y + 7.5}
        fontSize="6.5"
        textAnchor="middle"
        fill={active ? ACTIVE : TEXT}
        fontFamily="monospace"
      >
        {title}
      </text>
      <path
        d={`M${x + 5} ${y + 16}h24M${x + 5} ${y + 22}h16`}
        stroke={MUTED}
        strokeWidth="1"
      />
    </g>
  );
  return (
    <>
      {box(57, 6, "«Shape»", true)}
      <path
        d="M80 34v10M38 44h84M38 44v10M122 44v10"
        stroke={MUTED}
        strokeWidth="1"
        strokeDasharray="2.5 2"
      />
      <path
        d="M76 40l4-6 4 6z"
        stroke={MUTED}
        strokeWidth="1"
        fill="var(--background)"
      />
      {box(15, 56, "Circle")}
      {box(99, 56, "Square")}
    </>
  );
}

/** Review dates spreading out over time: spaced revision. */
function ScheduleArt() {
  const days = [
    { x: 18, label: "d1" },
    { x: 34, label: "d3" },
    { x: 62, label: "d7" },
    { x: 108, label: "d16" },
  ];
  return (
    <>
      <path d="M10 46h142" stroke={MUTED} strokeWidth="1" />
      <path d="M148 42l4 4-4 4" stroke={MUTED} strokeWidth="1" />
      {days.slice(0, -1).map((d, i) => {
        const next = days[i + 1]!;
        const mid = (d.x + next.x) / 2;
        const lift = 8 + i * 7;
        return (
          <path
            key={d.label}
            d={`M${d.x} 40Q${mid} ${40 - lift * 2} ${next.x} 40`}
            stroke={CELL}
            strokeWidth="1"
            strokeDasharray="3 2"
          />
        );
      })}
      {days.map((d, i) => (
        <g key={d.label}>
          <circle
            cx={d.x}
            cy="46"
            r="4"
            stroke={i === days.length - 1 ? ACTIVE : DONE}
            strokeWidth="1.3"
            fill={
              i === days.length - 1
                ? "color-mix(in oklch, var(--ember-500) 22%, transparent)"
                : "var(--background)"
            }
          />
          <text
            x={d.x}
            y="64"
            fontSize="7"
            textAnchor="middle"
            fill={i === days.length - 1 ? ACTIVE : MUTED}
            fontFamily="monospace"
          >
            {d.label}
          </text>
        </g>
      ))}
    </>
  );
}
