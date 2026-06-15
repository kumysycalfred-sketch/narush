import { EmployeeStats } from '../types';

interface Props {
  stats: EmployeeStats;
  maxCount: number;
  onClick: () => void;
}

export default function EmployeeCard({ stats, onClick, maxCount }: Props) {
  const topCategories = Object.entries(stats.byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2);

  const hasPenalty  = stats.meta3p['Лишение премии'] > 0;
  const hasForgiven = stats.meta3p['Прощение'] > 0;
  const pct         = maxCount > 0 ? Math.round((stats.count / maxCount) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg p-3.5 hover:-translate-y-0.5 transition-all duration-150 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-accent/50"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-primary font-semibold text-sm leading-tight truncate">{stats.name}</p>
          <p className="text-secondary text-xs truncate">{stats.position}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono text-lg font-bold text-danger leading-none">{stats.count}</p>
          {stats.refund > 0 && (
            <p className="font-mono text-xs text-warning">{stats.refund.toLocaleString('ru-RU')} ₽</p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden mb-2">
        <div
          className="h-full rounded-full bg-danger/50 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {topCategories.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {topCategories.map(([cat, count]) => (
            <span key={cat} className="text-xs px-1.5 py-0.5 rounded-md bg-accent/10 text-accent font-mono truncate max-w-full">
              {cat}: {count}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-1.5 flex-wrap">
        {hasPenalty && (
          <span className="text-xs px-1.5 py-0.5 rounded-md bg-warning/10 text-warning font-mono">
            −премия: {stats.meta3p['Лишение премии']}
          </span>
        )}
        {hasForgiven && (
          <span className="text-xs px-1.5 py-0.5 rounded-md bg-success/10 text-success font-mono">
            прощение: {stats.meta3p['Прощение']}
          </span>
        )}
      </div>
    </button>
  );
}
