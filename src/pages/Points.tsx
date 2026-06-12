import { useState, useMemo } from 'react';
import { SheetRow } from '../types';
import { buildPointStats } from '../utils/aggregate';
import KpiRow from '../components/KpiRow';
import BarChart from '../components/BarChart';
import PointCard from '../components/PointCard';
import PointModal from '../components/PointModal';

const SELECT_CLASS =
  'px-3 py-2 rounded-lg bg-card border border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent';

export default function Points({ rows }: { rows: SheetRow[] }) {
  const [filterObject, setFilterObject] = useState('');
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);

  const filtered = useMemo(() =>
    rows.filter(r => !filterObject || r.object === filterObject), [rows, filterObject]);

  const stats = useMemo(() => buildPointStats(filtered), [filtered]);

  const leader      = stats[0];
  const maxRefund   = [...stats].sort((a, b) => b.refund - a.refund)[0];
  const totalClean  = stats.reduce((s, p) => s + p.cleanCount, 0);

  const kpis = [
    { label: 'Всего точек',   value: stats.length,         color: '#3F3DC4', icon: '📍' },
    {
      label: 'Точка-лидер',   value: leader?.count ?? 0,
      sub: leader?.name,      color: '#D32B38',             icon: '🏆',
    },
    {
      label: 'Макс. возвраты', value: maxRefund?.refund ?? 0,
      sub: maxRefund?.name,   format: 'currency' as const,  color: '#D6850A', icon: '💰',
    },
    { label: 'Всего записей', value: filtered.length,       color: '#6B7280', icon: '📊' },
    { label: 'Без нарушений', value: totalClean,             color: '#1F9D57', icon: '✅' },
  ];

  const ratingData = useMemo(() => stats.map(s => ({ name: s.name, count: s.count })), [stats]);
  const top12 = stats.slice(0, 12);
  const maxCount = useMemo(() => stats.reduce((m, s) => Math.max(m, s.count), 0), [stats]);

  return (
    <div className="space-y-6">
      {/* Фильтр */}
      <div className="bg-card rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <select className={SELECT_CLASS} value={filterObject} onChange={e => setFilterObject(e.target.value)}>
          <option value="">Все объекты</option>
          {['Кухня', 'Бар', 'Цех', 'Поставщик'].map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <div className="flex items-center gap-2">
          {filterObject && (
            <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center shrink-0">
              1
            </span>
          )}
          <button
            onClick={() => setFilterObject('')}
            className={`text-secondary text-sm hover:text-primary underline transition-opacity ${
              filterObject ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            Сбросить
          </button>
        </div>
      </div>

      <KpiRow items={kpis} />

      <BarChart
        data={ratingData}
        title="Рейтинг точек по числу записей"
        color="#D32B38"
        onBarClick={setSelectedPoint}
      />

      {top12.length > 0 && (
        <div>
          <h2 className="text-primary font-semibold mb-4">
            Топ-12 точек{' '}
            <span className="text-secondary font-normal text-sm">— нажмите карточку для деталей</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {top12.map(s => (
              <div
                key={s.name}
                onClick={() => setSelectedPoint(s.name)}
                className="cursor-pointer"
              >
                <PointCard stats={s} maxCount={maxCount} />
              </div>
            ))}
          </div>
        </div>
      )}

      <PointModal
        pointName={selectedPoint}
        allRows={filtered}
        onClose={() => setSelectedPoint(null)}
      />
    </div>
  );
}
