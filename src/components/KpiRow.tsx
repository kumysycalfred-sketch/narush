import KpiCard, { KpiItem } from './KpiCard';

export default function KpiRow({ items }: { items: KpiItem[] }) {
  return (
    <div
      className="rounded-lg overflow-x-auto"
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div className="flex min-w-max sm:min-w-0">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex-1"
            style={i > 0 ? { borderLeft: '1px solid var(--border-color)' } : undefined}
          >
            <KpiCard {...item} />
          </div>
        ))}
      </div>
    </div>
  );
}
