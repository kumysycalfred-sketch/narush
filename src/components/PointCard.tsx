import { PointStats } from '../types';

interface Props {
  stats: PointStats;
  maxCount: number;
}

export default function PointCard({ stats, maxCount }: Props) {
  const pct = maxCount > 0 ? Math.round((stats.count / maxCount) * 100) : 0;

  const topCategories = Object.entries(stats.byCategory)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="rounded-lg p-4 hover:-translate-y-0.5 transition-all duration-150 cursor-pointer space-y-3" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>

      {/* Шапка */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-primary font-bold leading-tight truncate">{stats.name}</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            возвраты: {stats.refund > 0 ? `${stats.refund.toLocaleString('ru-RU')} ₽` : '—'}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold leading-tight" style={{ color: '#E84040' }}>{stats.count}</p>
          {stats.cleanCount > 0 && (
            <p className="text-xs" style={{ color: '#42B77A' }}>✓ {stats.cleanCount} чисто</p>
          )}
        </div>
      </div>

      {/* Прогресс-бар */}
      <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: '#E84040' }}
        />
      </div>

      {/* Категории */}
      {topCategories.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Категории
          </p>
          <div className="flex flex-wrap gap-1.5">
            {topCategories.map(([cat, count]) => (
              <span
                key={cat}
                className="text-xs px-2 py-0.5 rounded-full font-mono"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
              >
                {cat}: {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
