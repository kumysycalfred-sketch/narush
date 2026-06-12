import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SheetRow } from '../types';
import { buildPointStats } from '../utils/aggregate';

// ────────────────────────────────────────────────────────────
// Аккордеон-строка нарушения / проступка
// ────────────────────────────────────────────────────────────

interface AccordionItemProps {
  label: string;
  count: number;
  entries: SheetRow[];
  variant: 'danger' | 'warning';
}

function AccordionItem({ label, count, entries, variant }: AccordionItemProps) {
  const [open, setOpen] = useState(false);
  const countCls = variant === 'danger' ? 'text-danger' : 'text-warning';

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-2.5 gap-3 hover:bg-border/30 px-2 rounded-lg transition-colors"
      >
        <span className="text-primary text-sm text-left">{label}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`font-mono font-bold text-sm ${countCls}`}>{count}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14" height="14"
            viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            className={`text-secondary transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="pb-2 px-2 space-y-1.5">
              {entries.map((row, i) => (
                <div key={i} className="flex items-center gap-2 text-xs py-1 pl-2 border-l-2 border-border">
                  <span className="font-mono text-secondary shrink-0 w-16">{row.date}</span>
                  {row.name && <span className="text-primary truncate">{row.name}</span>}
                  {row.link ? (
                    <a
                      href={row.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="ml-auto text-accent hover:underline shrink-0 flex items-center gap-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                      ссылка
                    </a>
                  ) : (
                    <span className="ml-auto text-secondary/40 shrink-0">нет ссылки</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Секция с аккордеонами
// ────────────────────────────────────────────────────────────

interface AccordionSectionProps {
  title: string;
  items: Record<string, number>;
  rows: SheetRow[];
  field: 'violations' | 'misdemeanors';
  variant: 'danger' | 'warning';
}

function AccordionSection({ title, items, rows, field, variant }: AccordionSectionProps) {
  const sorted = Object.entries(items).sort(([, a], [, b]) => b - a);
  if (sorted.length === 0) return null;

  return (
    <div>
      <p className="text-secondary text-xs font-semibold uppercase tracking-wider mb-1">{title}</p>
      <div className="bg-card rounded-lg border border-border px-1">
        {sorted.map(([label, count]) => {
          const entries = rows.filter(r => r[field].includes(label));
          return (
            <AccordionItem
              key={label}
              label={label}
              count={count}
              entries={entries}
              variant={variant}
            />
          );
        })}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-secondary text-xs font-semibold uppercase tracking-wider mb-2">{title}</p>
      {children}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Основная модалка
// ────────────────────────────────────────────────────────────

interface Props {
  pointName: string | null;
  allRows: SheetRow[];
  onClose: () => void;
}

export default function PointModal({ pointName, allRows, onClose }: Props) {
  useEffect(() => {
    if (!pointName) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [pointName, onClose]);

  const pointRows = pointName ? allRows.filter(r => r.point === pointName) : [];
  const stats = buildPointStats(pointRows)[0];

  const sortedEntries = (r: Record<string, number>) =>
    Object.entries(r).sort(([, a], [, b]) => b - a);

  const cleanPct = stats && stats.count > 0
    ? Math.round((stats.cleanCount / stats.count) * 100)
    : 0;

  return (
    <AnimatePresence>
      {pointName && stats && (
        <motion.div
          key="point-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* Затемнение */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

          {/* Панель */}
          <motion.div
            className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto bg-card rounded-2xl shadow-2xl border border-border"
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            {/* Шапка */}
            <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-start justify-between gap-4 rounded-t-2xl z-10">
              <div>
                <h2 className="text-primary font-bold text-lg leading-tight">{stats.name}</h2>
                <p className="text-secondary text-sm">{pointRows[0]?.object ?? ''}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="font-mono text-2xl font-bold text-danger leading-none">{stats.count}</p>
                  <p className="text-secondary text-xs">записей</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-border transition-colors text-secondary hover:text-primary"
                  aria-label="Закрыть"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Контент */}
            <div className="px-5 py-4 space-y-5">

              {/* KPI-строка */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-success/10 rounded-xl px-3 py-3 text-center">
                  <p className="font-mono font-bold text-success text-xl">{cleanPct}%</p>
                  <p className="text-secondary text-xs mt-0.5">без нарушений</p>
                </div>
                <div className="bg-success/10 rounded-xl px-3 py-3 text-center">
                  <p className="font-mono font-bold text-success text-xl">{stats.cleanCount}</p>
                  <p className="text-secondary text-xs mt-0.5">чистых записей</p>
                </div>
                {stats.refund > 0 && (
                  <div className="bg-warning/10 rounded-xl px-3 py-3 text-center">
                    <p className="font-mono font-bold text-warning text-lg leading-tight">
                      {stats.refund.toLocaleString('ru-RU')} ₽
                    </p>
                    <p className="text-secondary text-xs mt-0.5">возвраты</p>
                  </div>
                )}
              </div>

              {/* Категории */}
              {Object.keys(stats.byCategory).length > 0 && (
                <Section title="Категории нарушений">
                  <div className="flex flex-wrap gap-1.5">
                    {sortedEntries(stats.byCategory).map(([cat, count]) => (
                      <span key={cat} className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-mono">
                        {cat}: {count}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Грубые нарушения — аккордеон */}
              <AccordionSection
                title="Грубые нарушения"
                items={stats.violations}
                rows={pointRows}
                field="violations"
                variant="danger"
              />

              {/* Проступки — аккордеон */}
              <AccordionSection
                title="Проступки"
                items={stats.misdemeanors}
                rows={pointRows}
                field="misdemeanors"
                variant="warning"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
