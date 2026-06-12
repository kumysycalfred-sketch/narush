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

export default function KpiCard({ label, value, sub, color = '#3F3DC4', format = 'number', icon, trend }: KpiItem) {
  const animated = useCountUp(value);

  const display =
    format === 'currency'
      ? animated.toLocaleString('ru-RU') + ' ₽'
      : format === 'percent'
      ? animated + '%'
      : animated.toLocaleString('ru-RU');

  return (
    <div className="bg-card rounded-xl p-4 relative overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
        style={{ backgroundColor: color }}
      />
      <div className="pl-3">
        <div className="flex items-start justify-between mb-1 gap-1">
          <p className="text-secondary text-xs leading-tight">{label}</p>
          {icon && <span className="text-sm opacity-50 shrink-0">{icon}</span>}
        </div>
        <div className="flex items-end gap-2">
          <p className="font-mono text-2xl font-semibold text-primary leading-none">{display}</p>
          {trend !== undefined && trend !== 0 && (
            <span className={`text-xs font-mono mb-0.5 leading-none ${trend > 0 ? 'text-danger' : 'text-success'}`}>
              {trend > 0 ? '↑' : '↓'}{Math.abs(trend)}%
            </span>
          )}
        </div>
        {sub && <p className="text-secondary text-xs mt-1 leading-tight">{sub}</p>}
      </div>
    </div>
  );
}
