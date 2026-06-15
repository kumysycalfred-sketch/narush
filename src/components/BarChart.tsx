import { useState } from 'react';
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis,
  ResponsiveContainer, Tooltip, Cell,
} from 'recharts';

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-color)',
      borderRadius: 6,
      padding: '7px 12px',
      minWidth: 130,
      pointerEvents: 'none',
    }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 3 }}>{label}</p>
      <p style={{ color: 'var(--text-primary)', fontSize: 15, fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, margin: 0 }}>
        {payload[0].value}
        <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: 11, marginLeft: 4 }}>зап.</span>
      </p>
    </div>
  );
}

interface Props {
  data: { name: string; count: number }[];
  color?: string;
  title: string;
  onBarClick?: (name: string) => void;
}

const BAR_BASE   = 'var(--text-secondary)';
const BAR_ACCENT = 'var(--accent)';

export default function BarChart({ data, title, onBarClick }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  if (!data.length) return null;

  const barHeight = 34;
  const height = data.length * barHeight + 24;
  const clickable = !!onBarClick;

  return (
    <div
      className="rounded-lg p-5"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
    >
      <div className="flex items-baseline gap-2 mb-4">
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
      <ResponsiveContainer width="100%" height={height}>
        <ReBarChart
          data={data}
          layout="vertical"
          margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
          onClick={clickable ? (e) => {
            const name = e?.activePayload?.[0]?.payload?.name;
            if (name) onBarClick(name);
          } : undefined}
          style={clickable ? { cursor: 'pointer' } : undefined}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontFamily: '"DM Sans", sans-serif' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: 'var(--bg-elevated)', radius: 2 }}
          />
          <Bar
            dataKey="count"
            radius={[0, 3, 3, 0]}
            isAnimationActive
            animationDuration={500}
            onMouseEnter={(_, i) => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {data.map((_, i) => {
              const isActive = activeIndex === i;
              const dimmed   = activeIndex !== null && !isActive;
              return (
                <Cell
                  key={i}
                  fill={isActive ? BAR_ACCENT : BAR_BASE}
                  fillOpacity={dimmed ? 0.35 : isActive ? 1 : 0.55}
                  style={{
                    cursor: clickable ? 'pointer' : 'default',
                    transition: 'fill 0.12s, fill-opacity 0.12s',
                  }}
                />
              );
            })}
          </Bar>
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}
