import { useMemo, useState } from 'react';
import { SheetRow } from '../types';
import { buildProcessorStats } from '../utils/aggregate';
import KpiRow from '../components/KpiRow';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props { rows: SheetRow[] }

const SELECT_CLASS =
  'px-3 py-2 rounded-lg bg-card border border-[var(--border-color)] text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer';

const DEPT_COLORS: Record<string, string> = {
  окк:   '#6366F1',
  адм:   '#F59E0B',
};

function deptColor(dept: string): string {
  const d = dept.toLowerCase();
  for (const [key, color] of Object.entries(DEPT_COLORS)) {
    if (d.includes(key)) return color;
  }
  return '#64748B';
}

export default function Departments({ rows }: Props) {
  const [filterDept, setFilterDept] = useState('');

  const allDepartments = useMemo(() =>
    [...new Set(rows.map(r => r.department).filter(Boolean))].sort(),
    [rows]
  );

  const filtered = useMemo(() =>
    filterDept
      ? rows.filter(r => r.department === filterDept)
      : rows,
    [rows, filterDept]
  );

  const stats = useMemo(() => buildProcessorStats(filtered), [filtered]);

  const okkCount = useMemo(() =>
    stats.filter(s => s.department.toLowerCase().includes('окк')).length,
    [stats]
  );
  const adminCount = useMemo(() =>
    stats.filter(s => s.department.toLowerCase().includes('адм')).length,
    [stats]
  );

  const kpis = [
    { label: 'Всего обработано',    value: filtered.filter(r => r.processor).length, color: '#3F3DC4', icon: '📋' },
    { label: 'Сотрудников ОКК',     value: okkCount,   color: '#6366F1', icon: '🔍' },
    { label: 'Сотрудников Админ',   value: adminCount, color: '#F59E0B', icon: '👤' },
    { label: 'Уникальных исп.',     value: stats.length, color: '#10B981', icon: '👥' },
  ];

  const chartData = stats.slice(0, 15).map(s => ({
    name: s.name.split(' ')[0],
    fullName: s.name,
    count: s.count,
    dept: s.department,
  }));

  const hasFilter = !!filterDept;

  return (
    <div className="space-y-6">
      <KpiRow items={kpis} />

      {/* Фильтры */}
      <div className="bg-card rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <select className={SELECT_CLASS} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
          <option value="">Все отделы</option>
          {allDepartments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <span className={`w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center shrink-0 transition-opacity ${hasFilter ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            1
          </span>
          <button
            onClick={() => setFilterDept('')}
            className={`text-secondary text-sm hover:text-primary underline transition-opacity ${hasFilter ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            Сбросить
          </button>
        </div>
      </div>

      {/* График топ исполнителей */}
      {chartData.length > 0 && (
        <div className="bg-card rounded-xl p-5">
          <h2 className="text-primary font-semibold mb-4">Топ исполнителей по количеству записей</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <Tooltip
                formatter={(v, _n, props) => [v, props.payload.fullName]}
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }}
                labelStyle={{ display: 'none' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={deptColor(entry.dept)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center text-xs text-secondary">
            <span><span className="inline-block w-3 h-3 rounded-sm mr-1" style={{ background: '#6366F1' }} />ОКК</span>
            <span><span className="inline-block w-3 h-3 rounded-sm mr-1" style={{ background: '#F59E0B' }} />Админ</span>
            <span><span className="inline-block w-3 h-3 rounded-sm mr-1" style={{ background: '#64748B' }} />Другой</span>
          </div>
        </div>
      )}

      {/* Таблица сотрудников */}
      <div className="bg-card rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border-color)]">
          <h2 className="text-primary font-semibold">
            Все исполнители ({stats.length})
          </h2>
        </div>
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr style={{ backgroundColor: 'var(--bg-base)' }}>
                <th className="text-left px-5 py-3 text-secondary font-medium">#</th>
                <th className="text-left px-5 py-3 text-secondary font-medium">Сотрудник</th>
                <th className="text-left px-5 py-3 text-secondary font-medium">Отдел</th>
                <th className="text-right px-5 py-3 text-secondary font-medium">Обработано</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s, i) => (
                <tr
                  key={s.name}
                  className="border-t border-[var(--border-color)] hover:bg-accent/5 transition-colors duration-100"
                >
                  <td className="px-5 py-3 text-secondary">{i + 1}</td>
                  <td className="px-5 py-3 text-primary font-medium">{s.name}</td>
                  <td className="px-5 py-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ background: deptColor(s.department) }}
                    >
                      {s.department || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-primary">{s.count}</td>
                </tr>
              ))}
              {stats.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-secondary">Нет данных</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
