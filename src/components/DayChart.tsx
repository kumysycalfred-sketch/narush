import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  Tooltip, CartesianGrid, Cell,
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
    }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 3 }}>{label}</p>
      <p style={{ color: 'var(--accent)', fontSize: 14, fontFamily: '"JetBrains Mono", monospace', fontWeight: 600, margin: 0 }}>
        {payload[0].value} <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: 11 }}>зап.</span>
      </p>
      <p style={{ color: 'var(--text-secondary)', fontSize: 10, marginTop: 3 }}>нажмите для деталей</p>
    </div>
  );
}

interface Props {
  data: { date: string; count: number }[];
  title: string;
  onBarClick?: (date: string) => void;
}

export default function DayChart({ data, title, onBarClick }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  if (!data.length) return null;

  const max = Math.max(...data.map(d => d.count));

  return (
    <div
      className="rounded-lg p-5"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
    >
      <h3
        className="font-display font-semibold text-sm mb-4"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data}
          margin={{ left: -16 }}
          onClick={e => {
            if (onBarClick && e?.activePayload?.[0]) {
              onBarClick(e.activePayload[0].payload.date as string);
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontFamily: '"DM Sans", sans-serif' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
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
            radius={[3, 3, 0, 0]}
            isAnimationActive
            animationDuration={500}
            onMouseEnter={(_, i) => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(null)}
            style={{ cursor: onBarClick ? 'pointer' : 'default' }}
          >
            {data.map((d, i) => {
              const intensity = max > 0 ? d.count / max : 0;
              const isActive = activeIndex === i;
              return (
                <Cell
                  key={i}
                  fill="var(--accent)"
                  fillOpacity={isActive ? 1 : 0.3 + intensity * 0.5}
                  style={{ transition: 'fill-opacity 0.12s' }}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
