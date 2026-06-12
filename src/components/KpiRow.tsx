import KpiCard, { KpiItem } from './KpiCard';

export default function KpiRow({ items }: { items: KpiItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      {items.map((item, i) => <KpiCard key={i} {...item} />)}
    </div>
  );
}
