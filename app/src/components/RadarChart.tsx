"use client";

/**
 * SVG Radar/Pentagon chart for club score breakdown.
 * Pure SVG, no dependencies.
 */

interface RadarChartProps {
  scores: { label: string; value: number; max?: number }[];
  size?: number;
  color?: string;
}

export default function RadarChart({
  scores,
  size = 200,
  color = "var(--accent)",
}: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38; // chart radius
  const n = scores.length;

  /** Get point on the polygon for a given index and distance from center */
  function getPoint(index: number, distance: number): [number, number] {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2; // start from top
    return [cx + distance * Math.cos(angle), cy + distance * Math.sin(angle)];
  }

  /** Build polygon path from an array of distances (0-1 normalized) */
  function polygon(distances: number[]): string {
    return distances
      .map((d, i) => {
        const [x, y] = getPoint(i, d * r);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ") + "Z";
  }

  // Grid lines (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const normalized = scores.map((s) => s.value / (s.max ?? 10));

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="block mx-auto"
    >
      {/* Grid polygons */}
      {gridLevels.map((level) => (
        <path
          key={level}
          d={polygon(Array(n).fill(level))}
          fill="none"
          stroke="var(--border)"
          strokeWidth={level === 1 ? 1.5 : 0.5}
          opacity={0.6}
        />
      ))}

      {/* Axis lines */}
      {scores.map((_, i) => {
        const [x, y] = getPoint(i, r);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="var(--border)"
            strokeWidth={0.5}
            opacity={0.4}
          />
        );
      })}

      {/* Data polygon - filled */}
      <path
        d={polygon(normalized)}
        fill={color}
        fillOpacity={0.15}
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* Data points */}
      {normalized.map((d, i) => {
        const [x, y] = getPoint(i, d * r);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={3.5}
            fill={color}
            stroke="var(--surface)"
            strokeWidth={2}
          />
        );
      })}

      {/* Labels */}
      {scores.map((s, i) => {
        const [x, y] = getPoint(i, r + 22);
        return (
          <g key={i}>
            <text
              x={x}
              y={y - 6}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground"
              fontSize={11}
              fontWeight={600}
            >
              {s.value}
            </text>
            <text
              x={x}
              y={y + 7}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted"
              fontSize={9}
            >
              {s.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
