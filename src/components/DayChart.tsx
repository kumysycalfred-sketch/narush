import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  Tooltip, CartesianGrid, Cell,
} from 'recharts';

// ─── Tooltip ────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(10, 14, 26, 0.95)',
      border: '1px solid rgba(255, 255, 255, 0.14)',
      borderRadius: 10,
      padding: '8px 12px',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    }}>
      <p style={{ color: '#94A3B8', fontSize: 11, marginBottom: 2 }}>{label}</p>
      <p style={{ color: '#6366F1', fontSize: 14, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
        {payload[0].value} <span style={{ color: '#94A3B8', fontWeight: 400, fontSize: 11 }}>записей</span>
      </p>
    </div>
  );
}

interface Props {
  data: { date: string; count: number }[];
  title: string;
}

export default function DayChart({ data, title }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  if (!data.length) return null;

  const max = Math.max(...data.map(d => d.count));

  return (
    <div className="bg-card rounded-xl p-5">
      <h3 className="text-primary font-semibold text-sm mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 4 }}
          />
          <Bar
            dataKey="count"
            radius={[4, 4, 0, 0]}
            isAnimationActive
            animationDuration={600}
            onMouseEnter={(_, i) => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {data.map((d, i) => {
              const intensity = max > 0 ? d.count / max : 0;
              const isActive = activeIndex === i;
              // Цвет: высокие значения → accent, низкие → приглушённый
              const opacity = isActive ? 1 : 0.45 + intensity * 0.55;
              return (
                <Cell
                  key={i}
                  fill="#6366F1"
                  fillOpacity={opacity}
                  stroke={isActive ? '#A78BFA' : 'transparent'}
                  strokeWidth={isActive ? 1.5 : 0}
                  style={{ transition: 'fill-opacity 0.15s', cursor: 'default' }}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
