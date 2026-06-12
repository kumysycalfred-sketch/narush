import { PointStats } from '../types';

interface Props {
  stats: PointStats;
  maxCount: number;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-secondary text-xs font-semibold uppercase tracking-wider mb-2">{title}</p>
      {children}
    </div>
  );
}

export default function PointCard({ stats, maxCount }: Props) {
  const sortedEntries = (r: Record<string, number>) =>
    Object.entries(r).sort(([, a], [, b]) => b - a);

  const pct = maxCount > 0 ? Math.round((stats.count / maxCount) * 100) : 0;

  return (
    <div className="bg-card rounded-xl p-5 space-y-4 border border-border hover:border-accent/30 hover:shadow-md hover:-translate-y-1 transition-all duration-200">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-primary font-semibold leading-tight">{stats.name}</h3>
          {stats.refund > 0 && (
            <p className="font-mono text-xs text-warning mt-0.5">
              возвраты: {stats.refund.toLocaleString('ru-RU')} ₽
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono text-xl font-bold text-danger">{stats.count}</p>
          {stats.cleanCount > 0 && (
            <p className="font-mono text-xs text-success">✓ {stats.cleanCount} чисто</p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-danger/50 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {Object.keys(stats.byCategory).length > 0 && (
        <Section title="Категории">
          <div className="flex flex-wrap gap-1.5">
            {sortedEntries(stats.byCategory).map(([cat, count]) => (
              <span key={cat} className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-mono">
                {cat}: {count}
              </span>
            ))}
          </div>
        </Section>
      )}

      {Object.keys(stats.violations).length > 0 && (
        <Section title="Грубые нарушения">
          <div className="space-y-1">
            {sortedEntries(stats.violations).map(([v, count]) => (
              <div key={v} className="flex justify-between text-sm gap-2">
                <span className="text-primary truncate">{v}</span>
                <span className="font-mono text-danger font-semibold shrink-0">{count}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {Object.keys(stats.misdemeanors).length > 0 && (
        <Section title="Проступки">
          <div className="space-y-1">
            {sortedEntries(stats.misdemeanors).map(([m, count]) => (
              <div key={m} className="flex justify-between text-sm gap-2">
                <span className="text-primary truncate">{m}</span>
                <span className="font-mono text-warning font-semibold shrink-0">{count}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
