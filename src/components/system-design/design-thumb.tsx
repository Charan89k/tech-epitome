import { cn } from "@/lib/utils";

/**
 * Line-art thumbnails for design surfaces: architecture boxes, a class
 * diagram, an interview loop, a conversation.
 *
 * Same vocabulary and palette as `MiniDiagram` (marketing), drawn on the
 * dark `viz-canvas` panel, but with the shapes the design pages actually
 * draw. Decorative only — no data, hidden from assistive tech.
 */

export type DesignThumbKind =
  | "fanout"
  | "pipeline"
  | "layers"
  | "classes"
  | "state"
  | "events"
  | "stages"
  | "chat"
  | "roadmap";

const LINE = "var(--viz-compare)";
const ACTIVE = "var(--ember-500)";
const MUTED = "var(--muted-foreground)";
const STORE = "var(--viz-visited)";
const TEXT = "var(--foreground)";
const ACTIVE_FILL = "color-mix(in oklch, var(--ember-500) 18%, transparent)";

export function DesignThumb({
  kind,
  className,
}: {
  kind: DesignThumbKind;
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
        {kind === "fanout" && <Fanout />}
        {kind === "pipeline" && <Pipeline />}
        {kind === "layers" && <Layers />}
        {kind === "classes" && <Classes />}
        {kind === "state" && <StateArt />}
        {kind === "events" && <Events />}
        {kind === "stages" && <Stages />}
        {kind === "chat" && <Chat />}
        {kind === "roadmap" && <Roadmap />}
      </svg>
    </div>
  );
}

function Box({
  x,
  y,
  w = 30,
  h = 16,
  active = false,
  store = false,
  label,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  active?: boolean;
  store?: boolean;
  label?: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={store ? 6 : 3}
        stroke={active ? ACTIVE : store ? STORE : LINE}
        strokeWidth="1.2"
        fill={active ? ACTIVE_FILL : "transparent"}
      />
      {label && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 3}
          fontSize="7"
          textAnchor="middle"
          fill={TEXT}
          fontFamily="monospace"
        >
          {label}
        </text>
      )}
    </g>
  );
}

function Arrow({ d }: { d: string }) {
  return <path d={d} stroke={MUTED} strokeWidth="1" strokeLinecap="round" />;
}

function Fanout() {
  return (
    <>
      <Box x={10} y={37} label="api" active />
      <Arrow d="M41 45 L62 22 M41 45 L62 45 M41 45 L62 68" />
      <Box x={63} y={14} label="q" />
      <Box x={63} y={37} label="q" />
      <Box x={63} y={60} label="q" />
      <Arrow d="M94 22 H114 M94 45 H114 M94 68 H114" />
      <Box x={115} y={14} w={34} label="push" store />
      <Box x={115} y={37} w={34} label="mail" store />
      <Box x={115} y={60} w={34} label="sms" store />
    </>
  );
}

function Pipeline() {
  return (
    <>
      <Box x={6} y={37} w={26} label="app" />
      <Arrow d="M33 45 H44" />
      <Box x={45} y={37} w={26} label="lb" />
      <Arrow d="M72 45 H83" />
      <Box x={84} y={37} w={28} label="api" active />
      <Arrow d="M113 45 L124 26 M113 45 L124 64" />
      <Box x={125} y={18} w={28} label="cache" store />
      <Box x={125} y={56} w={28} label="db" store />
    </>
  );
}

function Layers() {
  return (
    <>
      <Box x={20} y={10} w={120} h={16} label="clients" />
      <Arrow d="M80 27 V35" />
      <Box x={20} y={36} w={56} h={16} label="limiter" active />
      <Box x={84} y={36} w={56} h={16} label="api" />
      <Arrow d="M48 53 V61 M112 53 V61" />
      <Box x={20} y={62} w={120} h={16} label="counters" store />
    </>
  );
}

function ClassBox({
  x,
  y,
  name,
  active = false,
  rows = 2,
}: {
  x: number;
  y: number;
  name: string;
  active?: boolean;
  rows?: number;
}) {
  const h = 14 + rows * 7 + 4;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width="44"
        height={h}
        rx="3"
        stroke={active ? ACTIVE : LINE}
        strokeWidth="1.2"
        fill={active ? ACTIVE_FILL : "transparent"}
      />
      <text
        x={x + 22}
        y={y + 9.5}
        fontSize="7"
        textAnchor="middle"
        fill={TEXT}
        fontFamily="monospace"
      >
        {name}
      </text>
      <path
        d={`M${x} ${y + 13}h44`}
        stroke={active ? ACTIVE : LINE}
        strokeWidth="0.8"
      />
      {Array.from({ length: rows }).map((_, i) => (
        <path
          key={i}
          d={`M${x + 5} ${y + 19 + i * 7}h${i % 2 ? 20 : 28}`}
          stroke={MUTED}
          strokeWidth="1"
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}

function Classes() {
  return (
    <>
      <ClassBox x={58} y={6} name="«iface»" active />
      <ClassBox x={14} y={52} name="Lot" />
      <ClassBox x={102} y={52} name="Spot" />
      {/* Realisation arrows: dashed with hollow heads. */}
      <path
        d="M36 52 L66 37 M124 52 L94 37"
        stroke={MUTED}
        strokeWidth="1"
        strokeDasharray="3 2"
      />
      <path d="M66 37 l-6 0.5 M66 37 l-3 5" stroke={MUTED} strokeWidth="1" />
      <path d="M94 37 l6 0.5 M94 37 l3 5" stroke={MUTED} strokeWidth="1" />
      <path d="M58 66 H102" stroke={MUTED} strokeWidth="1" />
      <path d="M58 66 l5 -3 5 3 -5 3z" stroke={MUTED} strokeWidth="1" />
    </>
  );
}

function StateArt() {
  const states = [
    { x: 24, label: "idle" },
    { x: 80, label: "paid", active: true },
    { x: 136, label: "out" },
  ];
  return (
    <>
      {states.map((s) => (
        <g key={s.label}>
          <circle
            cx={s.x}
            cy="45"
            r="15"
            stroke={s.active ? ACTIVE : LINE}
            strokeWidth="1.2"
            fill={s.active ? ACTIVE_FILL : "transparent"}
          />
          <text
            x={s.x}
            y="48"
            fontSize="7"
            textAnchor="middle"
            fill={TEXT}
            fontFamily="monospace"
          >
            {s.label}
          </text>
        </g>
      ))}
      <Arrow d="M40 45 H64 M60 41 l4 4 -4 4 M96 45 H120 M116 41 l4 4 -4 4" />
      <path
        d="M128 31 C110 8 50 8 32 31"
        stroke={MUTED}
        strokeWidth="1"
        strokeDasharray="3 2"
      />
      <path d="M32 31 l1 -6 M32 31 l5 -3" stroke={MUTED} strokeWidth="1" />
    </>
  );
}

function Events() {
  return (
    <>
      <ClassBox x={8} y={26} name="Logger" active rows={3} />
      <Arrow d="M53 45 H70" />
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={72 + i * 12}
          y="37"
          width="10"
          height="16"
          rx="2"
          stroke={i === 3 ? ACTIVE : STORE}
          strokeWidth="1.1"
        />
      ))}
      <Arrow d="M121 45 H134" />
      <ClassBox x={108} y={60} name="Sink" rows={1} />
      <path d="M140 45 v12" stroke={MUTED} strokeWidth="1" />
    </>
  );
}

function Stages() {
  const xs = [18, 50, 82, 114, 146];
  return (
    <>
      <path d="M18 45 H146" stroke={MUTED} strokeWidth="1" />
      {xs.map((x, i) => (
        <g key={x}>
          <circle
            cx={x}
            cy="45"
            r="8"
            stroke={i <= 2 ? ACTIVE : LINE}
            strokeWidth="1.2"
            fill={
              i < 2 ? "var(--ember-500)" : i === 2 ? ACTIVE_FILL : "var(--background)"
            }
          />
          {i < 2 && (
            <path
              d={`M${x - 3} 45 l2 2.5 4 -5`}
              stroke="var(--background)"
              strokeWidth="1.4"
            />
          )}
        </g>
      ))}
      <text
        x="82"
        y="70"
        fontSize="7"
        textAnchor="middle"
        fill={ACTIVE}
        fontFamily="monospace"
      >
        approach
      </text>
    </>
  );
}

function Chat() {
  return (
    <>
      <rect
        x="14"
        y="14"
        width="86"
        height="18"
        rx="5"
        stroke={LINE}
        strokeWidth="1.2"
      />
      <path d="M22 23h54" stroke={MUTED} strokeWidth="1" strokeLinecap="round" />
      <rect
        x="60"
        y="38"
        width="86"
        height="18"
        rx="5"
        stroke={ACTIVE}
        strokeWidth="1.2"
        fill={ACTIVE_FILL}
      />
      <path
        d="M68 47h62"
        stroke={TEXT}
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.7"
      />
      <rect
        x="14"
        y="62"
        width="64"
        height="16"
        rx="5"
        stroke={LINE}
        strokeWidth="1.2"
      />
      <path d="M22 70h36" stroke={MUTED} strokeWidth="1" strokeLinecap="round" />
    </>
  );
}

function Roadmap() {
  return (
    <>
      <path
        d="M32 70 C44 70 42 45 54 45 M80 45 C92 45 94 20 106 20 M136 20 H145"
        stroke={MUTED}
        strokeWidth="1"
        strokeDasharray="3 2"
      />
      <Box x={6} y={62} w={26} label="dsa" active />
      <Box x={54} y={37} w={26} label="sd" />
      <Box x={106} y={12} w={30} label="mock" />
      <circle cx="148" cy="20" r="3" fill="var(--ember-500)" />
    </>
  );
}
