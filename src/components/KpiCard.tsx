import { useCountUp } from '../hooks/useCountUp';

export interface KpiItem {
  label: string;
  value: number;
  sub?: string;
  color?: string;
  format?: 'number' | 'currency' | 'percent';
  icon?: string;
  trend?: number;
}

export default function KpiCard({ label, value, sub, format = 'number', trend }: KpiItem) {
  const animated = useCountUp(value);

  const display =
    format === 'currency'
      ? animated.toLocaleString('ru-RU') + ' ₽'
      : format === 'percent'
      ? animated + '%'
      : animated.toLocaleString('ru-RU');

  return (
    <div className="px-5 py-4 min-w-0">
      <p
        className="text-[10px] font-sans font-medium uppercase tracking-widest leading-tight mb-1.5"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <p
          className="font-display font-semibold leading-none"
          style={{ color: 'var(--text-primary)', fontSize: '1.75rem' }}
        >
          {display}
        </p>
        {trend !== undefined && trend !== 0 && (
          <span
            className="text-xs font-mono leading-none shrink-0"
            style={{ color: trend > 0 ? '#E84040' : '#42B77A' }}
          >
            {trend > 0 ? '↑' : '↓'}{Math.abs(trend)}%
          </span>
        )}
      </div>
      {sub && (
        <p
          className="text-[10px] font-sans mt-1 leading-tight"
          style={{ color: 'var(--text-secondary)' }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
