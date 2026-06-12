import { useCountUp } from '../hooks/useCountUp';

export interface KpiItem {
  label: string;
  value: number;
  sub?: string;
  color?: string;
  format?: 'number' | 'currency' | 'percent';
}

export default function KpiCard({ label, value, sub, color = '#3F3DC4', format = 'number' }: KpiItem) {
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
      <p className="text-secondary text-xs mb-1 pl-3 leading-tight">{label}</p>
      <p className="font-mono text-2xl font-semibold text-primary pl-3 leading-none">{display}</p>
      {sub && <p className="text-secondary text-xs mt-1 pl-3 leading-tight">{sub}</p>}
    </div>
  );
}
