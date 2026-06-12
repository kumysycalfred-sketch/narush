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
    <div className="bg-card rounded-xl p-4 border border-[var(--border-color)] hover:border-accent/30 hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer space-y-3">

      {/* Шапка */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-primary font-bold leading-tight truncate">{stats.name}</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            возвраты: {stats.refund > 0 ? `${stats.refund.toLocaleString('ru-RU')} ₽` : '—'}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold leading-tight" style={{ color: '#F43F5E' }}>{stats.count}</p>
          {stats.cleanCount > 0 && (
            <p className="text-xs" style={{ color: '#10B981' }}>✓ {stats.cleanCount} чисто</p>
          )}
        </div>
      </div>

      {/* Прогресс-бар */}
      <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: '#F43F5E' }}
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
                style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1' }}
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
