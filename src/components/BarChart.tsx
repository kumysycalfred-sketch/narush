import { useState } from 'react';
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis,
  ResponsiveContainer, Tooltip, Cell,
} from 'recharts';

const PALETTE = [
  '#6366F1', '#F43F5E', '#10B981', '#F59E0B',
  '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6',
  '#F97316', '#84CC16', '#3B82F6', '#A855F7',
];

// ─── Tooltip ────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; payload: { _fill: string } }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const color = payload[0]?.payload?._fill ?? '#6366F1';
  return (
    <div style={{
      background: 'rgba(8, 12, 24, 0.97)',
      border: `1px solid ${color}66`,
      borderRadius: 10,
      padding: '8px 14px',
      backdropFilter: 'blur(8px)',
      boxShadow: `0 4px 24px rgba(0,0,0,0.6), 0 0 12px ${color}22`,
      minWidth: 140,
      pointerEvents: 'none',
      zIndex: 999,
    }}>
      <p style={{ color: '#CBD5E1', fontSize: 11, marginBottom: 4, fontWeight: 500 }}>{label}</p>
      <p style={{ color, fontSize: 15, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, margin: 0 }}>
        {payload[0].value}
        <span style={{ color: '#64748B', fontWeight: 400, fontSize: 11, marginLeft: 4 }}>записей</span>
      </p>
    </div>
  );
}

interface Props {
  data: { name: string; count: number }[];
  color?: string; // оставлен для совместимости, не влияет на цвет баров
  title: string;
  onBarClick?: (name: string) => void;
}

export default function BarChart({ data, title, onBarClick }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  if (!data.length) return null;

  // Добавляем _fill в каждую точку для Tooltip
  const enriched = data.map((d, i) => ({ ...d, _fill: PALETTE[i % PALETTE.length] }));

  const barHeight = 36;
  const height = data.length * barHeight + 24;
  const clickable = !!onBarClick;

  return (
    <div className="bg-card rounded-xl p-5">
      <h3 className="text-primary font-semibold text-sm mb-4">
        {title}
        {clickable && (
          <span className="ml-2 text-secondary font-normal text-xs">— нажмите для деталей</span>
        )}
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <ReBarChart
          data={enriched}
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
            tick={{ fontSize: 12, fill: 'var(--text-primary)' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 4 }}
          />
          <Bar
            dataKey="count"
            radius={[0, 6, 6, 0]}
            isAnimationActive
            animationDuration={600}
            onMouseEnter={(_, i) => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {enriched.map((entry, i) => {
              const isActive = activeIndex === i;
              const dimmed = activeIndex !== null && !isActive;
              return (
                <Cell
                  key={i}
                  fill={entry._fill}
                  fillOpacity={dimmed ? 0.3 : 1}
                  stroke={isActive ? entry._fill : 'transparent'}
                  strokeWidth={isActive ? 2 : 0}
                  style={{
                    cursor: clickable ? 'pointer' : 'default',
                    transition: 'fill-opacity 0.15s',
                    filter: isActive ? `drop-shadow(0 0 8px ${entry._fill}aa)` : 'none',
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
