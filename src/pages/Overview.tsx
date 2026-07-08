import { useState, useMemo } from 'react';
import { SheetRow } from '../types';
import { countBy, topN, byDate, sumCashRefund, sumBonusRefund, sumCertRefund, uniqueValues, buildShiftHeatmap, normShortDate } from '../utils/aggregate';
import { isGuestReview, isViolation, isBookkeepingType } from '../utils/parse';
import KpiRow from '../components/KpiRow';
import BarChart from '../components/BarChart';
import DonutChart from '../components/DonutChart';
import DayChart from '../components/DayChart';
import ShiftHeatmap from '../components/ShiftHeatmap';
import PointModal from '../components/PointModal';
import DayRecordsModal from '../components/DayRecordsModal';

const SELECT_CLASS =
  'px-3 py-2 rounded-lg bg-card border border-[var(--border-color)] text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent';

function pct(curr: number, prev: number): number | null {
  return prev === 0 ? null : Math.round(((curr - prev) / prev) * 100);
}

interface CompareItem { label: string; curr: number; prev: number; higherIsBad: boolean; currency?: boolean }

function CompareStrip({ items }: { items: CompareItem[] }) {
  return (
    <div className="rounded-lg px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <span className="text-secondary text-[10px] font-semibold uppercase tracking-widest shrink-0">
        vs предыдущий период
      </span>
      {items.map(item => {
        const delta = pct(item.curr, item.prev);
        const isUp = delta !== null && delta > 0;
        const color = delta === null || delta === 0
          ? 'text-secondary'
          : item.higherIsBad
            ? (isUp ? 'text-red-400' : 'text-green-400')
            : (isUp ? 'text-green-400' : 'text-red-400');
        return (
          <div key={item.label} className="flex items-baseline gap-1.5">
            <span className="text-secondary text-xs">{item.label}:</span>
            <span className="text-primary text-sm font-semibold tabular-nums">
              {item.currency ? `${item.curr.toLocaleString('ru')} р` : item.curr}
            </span>
            <span className="text-secondary text-xs tabular-nums">
              (было {item.currency ? `${item.prev.toLocaleString('ru')} р` : item.prev})
            </span>
            {delta !== null && (
              <span className={`text-xs font-medium tabular-nums ${color}`}>
                {isUp ? `+${delta}%` : `${delta}%`}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface Props { rows: SheetRow[]; prevRows: SheetRow[]; showCompare: boolean }

export default function Overview({ rows, prevRows, showCompare }: Props) {
  const [filterType, setFilterType]       = useState('');
  const [filterObject, setFilterObject]   = useState('');
  const [filterPoint, setFilterPoint]     = useState('');
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
  const [selectedDay, setSelectedDay]     = useState<string | null>(null);

  const allPoints = useMemo(() => uniqueValues(rows, 'point'), [rows]);

  const filtered = useMemo(() => rows.filter(r => {
    if (filterType   && !r.type.startsWith(filterType))  return false;
    if (filterObject && r.object !== filterObject)        return false;
    if (filterPoint  && r.point  !== filterPoint)         return false;
    return true;
  }), [rows, filterType, filterObject, filterPoint]);

  const filteredPrev = useMemo(() => prevRows.filter(r => {
    if (filterType   && !r.type.startsWith(filterType))  return false;
    if (filterObject && r.object !== filterObject)        return false;
    if (filterPoint  && r.point  !== filterPoint)         return false;
    return true;
  }), [prevRows, filterType, filterObject, filterPoint]);

  const guestRows     = useMemo(() => filtered.filter(r => isGuestReview(r.type)), [filtered]);
  // Сертификаты/возврат 30%/тех.возврат — не отработанные отзывы или нарушения,
  // а просто внесение в таблицу для учёта возврата — не должны идти в зачёт.
  const withViolation = useMemo(
    () => filtered.filter(r => isViolation(r.resolution) && !isBookkeepingType(r.type)),
    [filtered]
  );

  const kpis = [
    { label: 'Всего записей',    value: filtered.length,          color: '#3F3DC4', icon: '📋' },
    {
      label: 'Отзывов гостей',   value: guestRows.length,
      // БАГ 8: исключаем строки с пустым type, чтобы не завышать счётчик "доп/адм"
      sub: `доп/адм: ${filtered.filter(r => r.type && !isGuestReview(r.type) && !isBookkeepingType(r.type)).length}`,
      color: '#6B7280',          icon: '💬',
    },
    { label: 'С нарушениями',    value: withViolation.length,     color: '#D32B38', icon: '⚠️' },
    { label: 'Возврат деньгами', value: sumCashRefund(filtered),  format: 'currency' as const, color: '#D6850A', icon: '💰' },
    { label: 'Сертификаты',      value: sumCertRefund(filtered),  format: 'currency' as const, color: '#5B8A8B', icon: '🎫' },
    { label: 'Начислено баллов', value: sumBonusRefund(filtered), format: 'currency' as const, color: '#8B5CF6', icon: '🎁' },
  ];

  const compareItems: CompareItem[] = [
    { label: 'Записей',   curr: filtered.length,         prev: filteredPrev.length,                                         higherIsBad: false },
    { label: 'Нарушений', curr: withViolation.length,    prev: filteredPrev.filter(r => isViolation(r.resolution) && !isBookkeepingType(r.type)).length,  higherIsBad: true  },
    { label: 'Возврат',   curr: sumCashRefund(filtered), prev: sumCashRefund(filteredPrev), higherIsBad: true, currency: true },
  ];

  const topPoints  = useMemo(() => topN(countBy(filtered, r => r.point), 12), [filtered]);
  const objects    = useMemo(() => Object.entries(countBy(filtered, r => r.object)).map(([name, value]) => ({ name, value })), [filtered]);
  const categories = useMemo(() => {
    const acc: Record<string, number> = {};
    filtered.forEach(r => r.categories.forEach(c => { acc[c] = (acc[c] || 0) + 1; }));
    return topN(acc, 12);
  }, [filtered]);
  const resolutions = useMemo(() => Object.entries(countBy(filtered, r => r.resolution)).map(([name, value]) => ({ name, value })), [filtered]);
  const days        = useMemo(() => byDate(filtered), [filtered]);
  const sources     = useMemo(() => topN(countBy(filtered, r => r.source), 8), [filtered]);
  const heatmap     = useMemo(() => buildShiftHeatmap(filtered), [filtered]);

  // БАГ 2: нормализуем r.date к "DD.MM" перед сравнением, чтобы "9.6.26" == "09.06"
  const dayRecords = useMemo(
    () => selectedDay ? filtered.filter(r => normShortDate(r.date) === selectedDay) : [],
    [filtered, selectedDay]
  );

  const reset = () => { setFilterType(''); setFilterObject(''); setFilterPoint(''); };
  const hasFilter = filterType || filterObject || filterPoint;

  return (
    <div className="space-y-6">
      <div className="rounded-lg p-4 flex flex-wrap gap-3 items-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
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
            className={`text-secondary text-sm hover:text-primary underline transition-opacity ${hasFilter ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            Сбросить
          </button>
        </div>
      </div>

      {showCompare && filteredPrev.length > 0 && (
        <CompareStrip items={compareItems} />
      )}

      <KpiRow items={kpis} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BarChart data={topPoints} title="Топ точек по числу записей" onBarClick={setSelectedPoint} />
        <DonutChart
          data={objects}
          title="Объект"
          onSegmentClick={name => setFilterObject(prev => prev === name ? '' : name)}
        />
        <BarChart data={categories} title="Категории нарушений" color="#D32B38" />
        <DonutChart data={resolutions} title="Решение по обращению" />
        <DayChart data={days} title="Динамика по дням" onBarClick={setSelectedDay} />
        <BarChart data={sources} title="Источник отзыва" color="#D6850A" />
        {heatmap.length > 0 && (
          <ShiftHeatmap data={heatmap} title="Нарушения: день vs ночь по точкам" />
        )}
      </div>

      <PointModal pointName={selectedPoint} allRows={filtered} onClose={() => setSelectedPoint(null)} />
      <DayRecordsModal date={selectedDay} records={dayRecords} onClose={() => setSelectedDay(null)} />
    </div>
  );
}