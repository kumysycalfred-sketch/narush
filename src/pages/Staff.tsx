import { useState, useMemo } from 'react';
import { SheetRow, EmployeeStats } from '../types';
import { buildEmployeeStats, topN, countBy, sumRefund, sumCashRefund, sumBonusRefund, sumCertRefund, uniqueValues } from '../utils/aggregate';
import KpiRow from '../components/KpiRow';
import BarChart from '../components/BarChart';
import EmployeeCard from '../components/EmployeeCard';
import EmployeeModal from '../components/EmployeeModal';
import DataTable from '../components/DataTable';

const SELECT_CLASS =
  'px-3 py-2 rounded-lg bg-card border border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent';

export default function Staff({ rows }: { rows: SheetRow[] }) {
  const [filterPosition, setFilterPosition] = useState('');
  const [filterPoint, setFilterPoint] = useState('');
  const [selected, setSelected] = useState<EmployeeStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const allPositions = useMemo(() => uniqueValues(rows.filter(r => r.name), 'position'), [rows]);
  const allPoints    = useMemo(() => uniqueValues(rows.filter(r => r.name), 'point'), [rows]);

  const namedRows = useMemo(() => rows.filter(r => r.name), [rows]);

  const filtered = useMemo(() => namedRows.filter(r => {
    if (filterPosition && r.position !== filterPosition) return false;
    if (filterPoint && r.point !== filterPoint) return false;
    return true;
  }), [namedRows, filterPosition, filterPoint]);

  const searched = useMemo(() =>
    searchQuery.trim()
      ? filtered.filter(r =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.position.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : filtered,
    [filtered, searchQuery]
  );

  const stats = useMemo(() => buildEmployeeStats(searched), [searched]);

  const penaltyCount  = useMemo(() => searched.filter(r => r.meta3p === 'Лишение премии').length, [searched]);
  const forgivenCount = useMemo(() => searched.filter(r => r.meta3p === 'Прощение').length, [searched]);

  const kpis = [
    { label: 'Записей с ФИО',          value: searched.length,    color: '#3F3DC4', icon: '📋' },
    { label: 'Уникальных сотрудников', value: stats.length,       color: '#6B7280', icon: '👥' },
    { label: 'Лишений премии',         value: penaltyCount,       color: '#D32B38', icon: '❌' },
    { label: 'Возврат деньгами',        value: sumCashRefund(searched),  format: 'currency' as const, color: '#D6850A', icon: '💰' },
    { label: 'Сертификаты',             value: sumCertRefund(searched),  format: 'currency' as const, color: '#5B8A8B', icon: '🎫' },
    { label: 'Начислено баллов',        value: sumBonusRefund(searched), format: 'currency' as const, color: '#8B5CF6', icon: '🎁' },
    { label: 'Прощений',               value: forgivenCount,      color: '#1F9D57', icon: '🤝' },
  ];

  const top15 = useMemo(() => topN(countBy(searched, r => r.name), 15), [searched]);
  const top25 = stats.slice(0, 25);
  const maxCount = useMemo(() => stats.reduce((m, s) => Math.max(m, s.count), 0), [stats]);

  const reset            = () => { setFilterPosition(''); setFilterPoint(''); setSearchQuery(''); };
  const hasFilter        = filterPosition || filterPoint || searchQuery;
  const activeFilterCount = [filterPosition, filterPoint, searchQuery].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Фильтры */}
      <div className="rounded-lg p-4 flex flex-wrap gap-3 items-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <select className={SELECT_CLASS} value={filterPosition} onChange={e => setFilterPosition(e.target.value)}>
          <option value="">Все должности</option>
          {allPositions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className={SELECT_CLASS} value={filterPoint} onChange={e => setFilterPoint(e.target.value)}>
          <option value="">Все точки</option>
          {allPoints.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-sm pointer-events-none select-none">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени или должности..."
            aria-label="Поиск по имени или должности"
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-card border border-[var(--border-color)] text-primary text-sm placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center shrink-0 transition-opacity ${hasFilter ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {activeFilterCount}
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

      <BarChart
        data={top15}
        title="Топ-15 нарушителей"
        color="#D32B38"
        onBarClick={(name) => {
          const found = stats.find(s => s.name === name);
          if (found) setSelected(found);
        }}
      />

      {top25.length > 0 && (
        <div>
          <h2 className="text-primary font-semibold mb-4">
            Топ-{top25.length} сотрудников{' '}
            <span className="text-secondary font-normal text-sm">— нажмите карточку для деталей</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {top25.map(s => (
              <EmployeeCard key={s.name} stats={s} maxCount={maxCount} onClick={() => setSelected(s)} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-primary font-semibold mb-4">
          Все записи с ФИО ({searched.length})
        </h2>
        <DataTable rows={searched} />
      </div>

      <EmployeeModal
        stats={selected}
        employeeRows={selected ? searched.filter(r => r.name === selected.name) : []}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
