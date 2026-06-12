import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { SheetRow, ProcessorStats } from '../types';
import { buildProcessorStats } from '../utils/aggregate';

interface Props { rows: SheetRow[] }

// Только реальные отделы
const KNOWN_DEPTS = ['Обратная связь', 'Админ'];

const DEPT_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  'Обратная связь': { color: '#6366F1', bg: 'rgba(99,102,241,0.12)', icon: '🔍', label: 'Обратная связь' },
  'Админ':          { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  icon: '👤', label: 'Администраторы' },
};

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function DeptSection({ dept, stats }: { dept: string; stats: ProcessorStats[] }) {
  const cfg = DEPT_CONFIG[dept] ?? { color: '#64748B', bg: 'rgba(100,116,139,0.12)', icon: '👥', label: dept };
  const max = stats[0]?.count ?? 1;

  return (
    <div className="bg-card rounded-2xl overflow-hidden flex flex-col">
      {/* Шапка отдела */}
      <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: `1px solid var(--border-color)` }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ background: cfg.bg }}
        >
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-primary font-semibold">{cfg.label}</p>
          <p className="text-secondary text-xs">{stats.length} сотрудников</p>
        </div>
        <div
          className="px-3 py-1 rounded-full text-xs font-bold text-white shrink-0"
          style={{ background: cfg.color }}
        >
          {stats.reduce((s, r) => s + r.count, 0)} записей
        </div>
      </div>

      {/* Список сотрудников */}
      <div className="divide-y divide-[var(--border-color)] flex-1">
        {stats.length === 0 && (
          <p className="px-5 py-8 text-center text-secondary text-sm">Нет данных</p>
        )}
        {stats.map((s, i) => {
          const pct = max > 0 ? Math.round((s.count / max) * 100) : 0;
          return (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              className="px-5 py-3.5 flex items-center gap-3 hover:bg-accent/5 transition-colors duration-100"
            >
              {/* Ранг */}
              <span className="text-secondary text-xs font-mono w-5 shrink-0 text-center">
                {i + 1}
              </span>

              {/* Аватар */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: cfg.color }}
              >
                {initials(s.name)}
              </div>

              {/* Имя + прогресс */}
              <div className="flex-1 min-w-0">
                <p className="text-primary text-sm font-medium truncate">{s.name}</p>
                <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: cfg.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: i * 0.04 + 0.1, duration: 0.4, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Счётчик */}
              <span
                className="text-sm font-bold shrink-0 tabular-nums"
                style={{ color: cfg.color }}
              >
                {s.count}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function Departments({ rows }: Props) {
  const [filterDept, setFilterDept] = useState('');

  const deptRows = useMemo(() =>
    rows.filter(r => KNOWN_DEPTS.includes(r.department)),
    [rows]
  );

  const allStats = useMemo(() => buildProcessorStats(deptRows), [deptRows]);

  const totalProcessed = deptRows.filter(r => r.processor).length;
  const osByDept = useMemo(() => allStats.filter(s => s.department === 'Обратная связь'), [allStats]);
  const adminByDept = useMemo(() => allStats.filter(s => s.department.toLowerCase().includes('адм')), [allStats]);

  // Секции для отображения
  const sections = filterDept
    ? KNOWN_DEPTS.filter(d => d === filterDept)
    : KNOWN_DEPTS;

  const statsForDept = (dept: string) =>
    allStats.filter(s => s.department === dept);

  return (
    <div className="space-y-6">

      {/* KPI панель */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {/* Всего */}
        <div className="bg-card rounded-2xl p-5 col-span-2 sm:col-span-1 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
               style={{ background: 'rgba(63,61,196,0.12)' }}>
            📋
          </div>
          <div>
            <p className="text-secondary text-xs mb-0.5">Всего обработано</p>
            <p className="text-primary text-2xl font-bold">{totalProcessed}</p>
          </div>
        </div>

        {/* Обратная связь */}
        <div className="bg-card rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
               style={{ background: 'rgba(99,102,241,0.12)' }}>
            🔍
          </div>
          <div>
            <p className="text-secondary text-xs mb-0.5">Обратная связь</p>
            <p className="text-2xl font-bold" style={{ color: '#6366F1' }}>{osByDept.length}</p>
          </div>
        </div>

        {/* Администраторы */}
        <div className="bg-card rounded-2xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
               style={{ background: 'rgba(245,158,11,0.12)' }}>
            👤
          </div>
          <div>
            <p className="text-secondary text-xs mb-0.5">Администраторы</p>
            <p className="text-2xl font-bold" style={{ color: '#F59E0B' }}>{adminByDept.length}</p>
          </div>
        </div>
      </div>

      {/* Фильтр */}
      <div className="flex gap-2 flex-wrap">
        {['', ...KNOWN_DEPTS].map(d => (
          <button
            key={d}
            onClick={() => setFilterDept(d)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150"
            style={filterDept === d
              ? { background: DEPT_CONFIG[d]?.color ?? '#6366F1', color: '#fff' }
              : { background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }
            }
          >
            {d === '' ? 'Все отделы' : (DEPT_CONFIG[d]?.label ?? d)}
          </button>
        ))}
      </div>

      {/* Секции по отделам */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {sections.map(dept => (
          <DeptSection key={dept} dept={dept} stats={statsForDept(dept)} />
        ))}
      </div>
    </div>
  );
}
