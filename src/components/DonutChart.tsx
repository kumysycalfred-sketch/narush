import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';

// Muted, editorial palette — not rainbow
const COLORS = [
  '#7CA52A', '#5B8A8B', '#A0623A', '#8B6FA0',
  '#4A7B9D', '#C4936A', '#6B8E5E', '#9B6B6B',
];

function ChartTooltip({ active, payload }: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { fill?: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  const color = payload[0].payload.fill ?? COLORS[0];
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-color)',
      borderRadius: 6,
      padding: '7px 12px',
    }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 3 }}>{name}</p>
      <p style={{ color, fontSize: 14, fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, margin: 0 }}>
        {value} <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: 11 }}>зап.</span>
      </p>
    </div>
  );
}

function ActiveSector(props: Record<string, unknown>) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props as {
    cx: number; cy: number;
    innerRadius: number; outerRadius: number;
    startAngle: number; endAngle: number;
    fill: string;
  };
  return (
    <Sector
      cx={cx} cy={cy}
      innerRadius={innerRadius - 2}
      outerRadius={(outerRadius as number) + 8}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
    />
  );
}

interface Props {
  data: { name: string; value: number }[];
  title: string;
  onSegmentClick?: (name: string) => void;
}

export default function DonutChart({ data, title, onSegmentClick }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  if (!data.length) return null;
  const clickable = !!onSegmentClick;

  const enriched = data.map((d, i) => ({ ...d, fill: COLORS[i % COLORS.length] }));

  return (
    <div
      className="rounded-lg p-5"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
    >
      <div className="flex items-baseline gap-2 mb-2">
        <h3
          className="font-display font-semibold text-sm"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h3>
        {clickable && (
          <span className="text-[10px] font-sans" style={{ color: 'var(--text-secondary)' }}>
            кликабельно
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={enriched}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={85}
            dataKey="value"
            isAnimationActive
            animationDuration={500}
            activeIndex={activeIndex ?? undefined}
            activeShape={ActiveSector}
            style={{ cursor: clickable ? 'pointer' : 'default', outline: 'none' }}
            onMouseEnter={(_, i) => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(null)}
            onClick={clickable ? (entry) => onSegmentClick(entry.name) : undefined}
          >
            {enriched.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.fill}
                fillOpacity={activeIndex === null || activeIndex === i ? 1 : 0.4}
                style={{ transition: 'fill-opacity 0.12s', outline: 'none' }}
              />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: '"DM Sans", sans-serif' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
