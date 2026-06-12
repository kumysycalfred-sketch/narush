import { useState, useMemo } from 'react';
import { SheetRow } from '../types';
import { countBy, topN, byDate, sumRefund, uniqueValues } from '../utils/aggregate';
import { isGuestReview, isViolation } from '../utils/parse';
import KpiRow from '../components/KpiRow';
import BarChart from '../components/BarChart';
import DonutChart from '../components/DonutChart';
import DayChart from '../components/DayChart';
import PointModal from '../components/PointModal';

const SELECT_CLASS =
  'px-3 py-2 rounded-lg bg-card border border-[var(--border-color)] text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent';

interface Props { rows: SheetRow[] }

export default function Overview({ rows }: Props) {
  const [filterType, setFilterType]     = useState('');
  const [filterObject, setFilterObject] = useState('');
  const [filterPoint, setFilterPoint]   = useState('');
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);

  const allPoints = useMemo(() => uniqueValues(rows, 'point'), [rows]);

  const filtered = useMemo(() => rows.filter(r => {
    if (filterType && !r.type.startsWith(filterType)) return false;
    if (filterObject && r.object !== filterObject) return false;
    if (filterPoint && r.point !== filterPoint) return false;
    return true;
  }), [rows, filterType, filterObject, filterPoint]);

  const guestRows    = useMemo(() => filtered.filter(r => isGuestReview(r.type)), [filtered]);
  const withViolation = useMemo(() => filtered.filter(r => isViolation(r.resolution)), [filtered]);
  const cleanPct = guestRows.length
    ? Math.round((guestRows.filter(r => !isViolation(r.resolution)).length / guestRows.length) * 100)
    : 0;

  const kpis = [
    { label: 'Всего записей',    value: filtered.length,           color: '#3F3DC4', icon: '📋' },
    {
      label: 'Отзывов гостей',   value: guestRows.length,
      sub: `доп/адм: ${filtered.length - guestRows.length}`,
      color: '#6B7280',          icon: '💬',
    },
    { label: 'С нарушениями',    value: withViolation.length,      color: '#D32B38', icon: '⚠️' },
    { label: 'Сумма возвратов',  value: sumRefund(filtered), format: 'currency' as const, color: '#D6850A', icon: '💰' },
    { label: 'Без нарушений',    value: cleanPct, format: 'percent' as const, color: '#1F9D57', icon: '✅' },
  ];

  const topPoints   = useMemo(() => topN(countBy(filtered, r => r.point), 12), [filtered]);
  const objects     = useMemo(() => Object.entries(countBy(filtered, r => r.object)).map(([name, value]) => ({ name, value })), [filtered]);
  const categories  = useMemo(() => {
    const acc: Record<string, number> = {};
    filtered.forEach(r => r.categories.forEach(c => { acc[c] = (acc[c] || 0) + 1; }));
    return topN(acc, 12);
  }, [filtered]);
  const resolutions = useMemo(() => Object.entries(countBy(filtered, r => r.resolution)).map(([name, value]) => ({ name, value })), [filtered]);
  const days        = useMemo(() => byDate(filtered), [filtered]);
  const sources     = useMemo(() => topN(countBy(filtered, r => r.source), 8), [filtered]);

  const reset = () => { setFilterType(''); setFilterObject(''); setFilterPoint(''); };
  const hasFilter = filterType || filterObject || filterPoint;

  return (
    <div className="space-y-6">
      {/* Фильтры */}
      <div className="bg-card rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <select className={SELECT_CLASS} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Все типы</option>
          <option value="Отзыв гостя">Отзыв гостя</option>
          <option value="доп нарушение">Доп нарушение</option>
        </select>
        <select className={SELECT_CLASS} value={filterObject} onChange={e => setFilterObject(e.target.value)}>
          <option value="">Все объекты</option>
          {['Кухня', 'Бар', 'Цех', 'Поставщик'].map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <select className={SELECT_CLASS} value={filterPoint} onChange={e => setFilterPoint(e.target.value)}>
          <option value="">Все точки</option>
          {allPoints.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <span className={`w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center shrink-0 transition-opacity ${hasFilter ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {[filterType, filterObject, filterPoint].filter(Boolean).length}
          </span>
          <button
            onClick={reset}
            className={`text-secondary text-sm hover:text-primary underline transition-opacity ${
              hasFilter ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            Сбросить
          </button>
        </div>
      </div>

      <KpiRow items={kpis} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Топ точек — кликабелен → PointModal */}
        <BarChart
          data={topPoints}
          title="Топ точек по числу записей"
          onBarClick={setSelectedPoint}
        />

        {/* Объект — клик устанавливает фильтр */}
        <DonutChart
          data={objects}
          title="Объект"
          onSegmentClick={(name) => {
            setFilterObject(prev => prev === name ? '' : name);
          }}
        />

        <BarChart data={categories} title="Категории нарушений" color="#D32B38" />
        <DonutChart data={resolutions} title="Решение по обращению" />
        <DayChart data={days} title="Динамика по дням" />
        <BarChart data={sources} title="Источник отзыва" color="#D6850A" />
      </div>

      <PointModal
        pointName={selectedPoint}
        allRows={filtered}
        onClose={() => setSelectedPoint(null)}
      />
    </div>
  );
}
