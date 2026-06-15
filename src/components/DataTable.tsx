import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SheetRow } from '../types';

type EnrichedRow = SheetRow & {
  categoriesStr: string;
  violationsStr: string;
  misdemeanorsStr: string;
};

const COLUMNS: { key: keyof EnrichedRow; label: string }[] = [
  { key: 'date', label: 'Дата' },
  { key: 'name', label: 'ФИО' },
  { key: 'position', label: 'Должность' },
  { key: 'point', label: 'Точка' },
  { key: 'categoriesStr', label: 'Категория' },
  { key: 'violationsStr', label: 'Нарушение' },
  { key: 'misdemeanorsStr', label: 'Проступок' },
  { key: 'meta3p', label: '3-П' },
];

type SortKey = typeof COLUMNS[number]['key'];

interface Props {
  rows: SheetRow[];
}

export default function DataTable({ rows }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [visible, setVisible] = useState(10);

  const enriched = useMemo((): EnrichedRow[] =>
    rows.map(r => ({
      ...r,
      categoriesStr: r.categories.join(', '),
      violationsStr: r.violations.join(', '),
      misdemeanorsStr: r.misdemeanors.join(', '),
    })), [rows]);

  const sorted = useMemo(() => {
    return [...enriched].sort((a, b) => {
      const av = String(a[sortKey] ?? '');
      const bv = String(b[sortKey] ?? '');
      return sortAsc ? av.localeCompare(bv, 'ru') : bv.localeCompare(av, 'ru');
    });
  }, [enriched, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(true); }
  };

  const shown = sorted.slice(0, visible);

  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr
              className="border-b border-[var(--border-color)]"
              style={{ backgroundColor: 'var(--bg-base)' }}
            >
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className="px-4 py-3 text-left text-secondary font-medium cursor-pointer hover:text-primary select-none whitespace-nowrap"
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1">{sortAsc ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {shown.map((row, i) => (
                <motion.tr
                  key={`${row.date}-${row.name}-${i}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: i >= 10 ? (i - (visible - 50)) * 0.03 : 0 }}
                  className={`border-b border-[var(--border-color)] last:border-0 hover:bg-accent/5 transition-colors duration-100 ${
                    i % 2 === 0 ? '' : 'bg-[var(--bg-base)]'
                  }`}
                >
                  <td className="px-4 py-2 font-mono text-xs text-secondary">{row.date}</td>
                  <td className="px-4 py-2 text-primary font-medium whitespace-nowrap">{row.name}</td>
                  <td className="px-4 py-2 text-secondary whitespace-nowrap">{row.position}</td>
                  <td className="px-4 py-2 text-secondary whitespace-nowrap">{row.point}</td>
                  <td className="px-4 py-2 text-secondary">{row.categoriesStr}</td>
                  <td className="px-4 py-2 text-xs text-danger">{row.violationsStr}</td>
                  <td className="px-4 py-2 text-xs text-warning">{row.misdemeanorsStr}</td>
                  <td className="px-4 py-2 text-xs">
                    {row.meta3p && (
                      <span className={`px-2 py-0.5 rounded-full font-mono ${
                        row.meta3p === 'Прощение'
                          ? 'bg-success/10 text-success'
                          : 'bg-warning/10 text-warning'
                      }`}>
                        {row.meta3p}
                      </span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      {visible < sorted.length && (
        <div className="px-4 py-3 border-t border-[var(--border-color)] flex items-center justify-between">
          <span className="text-secondary text-xs">
            Показано {shown.length} из {sorted.length}
          </span>
          <button
            onClick={() => setVisible(v => v + 50)}
            className="text-accent text-sm font-medium hover:underline active:scale-95 transition-transform"
          >
            Загрузить ещё 50
          </button>
        </div>
      )}
    </div>
  );
}
