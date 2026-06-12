import { useState, useMemo } from 'react';
import { SheetRow, EmployeeStats } from '../types';
import { buildEmployeeStats, topN, countBy, sumRefund, uniqueValues } from '../utils/aggregate';
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

  const allPositions = useMemo(() => uniqueValues(rows.filter(r => r.name), 'position'), [rows]);
  const allPoints    = useMemo(() => uniqueValues(rows.filter(r => r.name), 'point'), [rows]);

  const namedRows = useMemo(() => rows.filter(r => r.name), [rows]);

  const filtered = useMemo(() => namedRows.filter(r => {
    if (filterPosition && r.position !== filterPosition) return false;
    if (filterPoint && r.point !== filterPoint) return false;
    return true;
  }), [namedRows, filterPosition, filterPoint]);

  const stats = useMemo(() => buildEmployeeStats(filtered), [filtered]);

  const penaltyCount  = useMemo(() => filtered.filter(r => r.meta3p === 'Лишение премии').length, [filtered]);
  const forgivenCount = useMemo(() => filtered.filter(r => r.meta3p === 'Прощение').length, [filtered]);

  const kpis = [
    { label: 'Записей с ФИО',          value: filtered.length,    color: '#3F3DC4', icon: '📋' },
    { label: 'Уникальных сотрудников', value: stats.length,       color: '#6B7280', icon: '👥' },
    { label: 'Лишений премии',         value: penaltyCount,       color: '#D32B38', icon: '❌' },
    { label: 'Сумма возвратов',        value: sumRefund(filtered), format: 'currency' as const, color: '#D6850A', icon: '💰' },
    { label: 'Прощений',               value: forgivenCount,      color: '#1F9D57', icon: '🤝' },
  ];

  const top15 = useMemo(() => topN(countBy(filtered, r => r.name), 15), [filtered]);
  const top25 = stats.slice(0, 25);

  const reset = () => { setFilterPosition(''); setFilterPoint(''); };

  return (
    <div className="space-y-6">
      {/* Фильтры */}
      <div className="bg-card rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <select className={SELECT_CLASS} value={filterPosition} onChange={e => setFilterPosition(e.target.value)}>
          <option value="">Все должности</option>
          {allPositions.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className={SELECT_CLASS} value={filterPoint} onChange={e => setFilterPoint(e.target.value)}>
          <option value="">Все точки</option>
          {allPoints.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {(filterPosition || filterPoint) && (
          <button onClick={reset} className="text-secondary text-sm hover:text-primary underline">
            Сбросить
          </button>
        )}
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
              <EmployeeCard key={s.name} stats={s} onClick={() => setSelected(s)} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-primary font-semibold mb-4">
          Все записи с ФИО ({filtered.length})
        </h2>
        <DataTable rows={filtered} />
      </div>

      <EmployeeModal
        stats={selected}
        employeeRows={selected ? filtered.filter(r => r.name === selected.name) : []}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
