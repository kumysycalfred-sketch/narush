import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';

const COLORS = ['#6366F1', '#F43F5E', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6'];

// ─── Tooltip ────────────────────────────────────────────────
function ChartTooltip({ active, payload }: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { fill?: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  const color = payload[0].payload.fill ?? COLORS[0];
  return (
    <div style={{
      background: 'rgba(10, 14, 26, 0.95)',
      border: '1px solid rgba(255, 255, 255, 0.14)',
      borderRadius: 10,
      padding: '8px 12px',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    }}>
      <p style={{ color: '#F1F5F9', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{name}</p>
      <p style={{ color, fontSize: 13, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
        {value} <span style={{ color: '#94A3B8', fontWeight: 400, fontSize: 11 }}>записей</span>
      </p>
    </div>
  );
}

// ─── Активный сектор — вырастает наружу ─────────────────────
function ActiveSector(props: Record<string, unknown>) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props as {
    cx: number; cy: number;
    innerRadius: number; outerRadius: number;
    startAngle: number; endAngle: number;
    fill: string;
  };
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius - 3}
      outerRadius={(outerRadius as number) + 10}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      style={{ filter: `drop-shadow(0 0 8px ${fill}88)` }}
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

  // Добавляем fill в payload для tooltip
  const enriched = data.map((d, i) => ({ ...d, fill: COLORS[i % COLORS.length] }));

  return (
    <div className="bg-card rounded-xl p-5">
      <h3 className="text-primary font-semibold text-sm mb-2">
        {title}
        {clickable && (
          <span className="ml-2 text-secondary font-normal text-xs">— нажмите для фильтра</span>
        )}
      </h3>
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
            animationDuration={600}
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
                fillOpacity={activeIndex === null || activeIndex === i ? 1 : 0.45}
                style={{ transition: 'fill-opacity 0.15s', outline: 'none' }}
              />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
