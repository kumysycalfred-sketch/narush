import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SheetRow, ProcessorStats } from '../types';
import { countBy, topN, sumCashRefund, sumBonusRefund } from '../utils/aggregate';
import { isViolation } from '../utils/parse';

interface Props {
  selected: ProcessorStats | null;
  rows: SheetRow[];
  onClose: () => void;
}

const DEPT_COLOR: Record<string, string> = {
  'Обратная связь': '#6366F1',
  'Админ': '#F59E0B',
};

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function ProcessorModal({ selected, rows, onClose }: Props) {
  const myRows = useMemo(
    () => rows.filter(r => r.processor === selected?.name),
    [rows, selected]
  );

  const withViolation  = useMemo(() => myRows.filter(r => isViolation(r.resolution)), [myRows]);
  const cleanCount     = myRows.length - withViolation.length;
  const violationPct   = myRows.length ? Math.round((withViolation.length / myRows.length) * 100) : 0;
  const cleanPct       = 100 - violationPct;

  const byPoint      = useMemo(() => topN(countBy(myRows, r => r.point), 10), [myRows]);
  const byResolution = useMemo(
    () => Object.entries(countBy(myRows, r => r.resolution || '—')).sort(([, a], [, b]) => b - a),
    [myRows]
  );
  const byType = useMemo(
    () => Object.entries(countBy(myRows, r => r.type || '—')).sort(([, a], [, b]) => b - a),
    [myRows]
  );

  const cashRefund  = useMemo(() => sumCashRefund(myRows), [myRows]);
  const bonusRefund = useMemo(() => sumBonusRefund(myRows), [myRows]);

  const color = DEPT_COLOR[selected?.department ?? ''] ?? '#6366F1';

  return (
    <AnimatePresence>
      {selected && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Панель */}
          <motion.div
            className="relative rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Шапка */}
            <div className="px-6 py-5 flex items-center gap-4 shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0"
                style={{ background: color }}
              >
                {initials(selected.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-primary font-bold text-lg leading-tight">{selected.name}</p>
                <p className="text-secondary text-sm mt-0.5">{selected.department}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:text-primary hover:bg-accent/10 transition-colors shrink-0 text-lg"
              >
                ✕
              </button>
            </div>

            {/* Тело (прокручивается) */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {myRows.length === 0 ? (
                <p className="text-secondary text-center py-8 text-sm">Нет данных за выбранный период</p>
              ) : (
                <>
                  {/* KPI */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Обработано',      value: myRows.length,                        color },
                      { label: 'С нарушением',     value: `${withViolation.length} (${violationPct}%)`, color: '#D32B38' },
                      { label: 'Без нарушений',    value: `${cleanCount} (${cleanPct}%)`,       color: '#1F9D57' },
                      { label: 'Возврат деньгами', value: cashRefund  ? `${cashRefund.toLocaleString('ru')} р`  : '—', color: '#D6850A' },
                      { label: 'Начислено баллов', value: bonusRefund ? `${bonusRefund.toLocaleString('ru')} р` : '—', color: '#8B5CF6' },
                    ].map(k => (
                      <div key={k.label} className="rounded-lg p-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
                        <p className="text-secondary text-xs mb-1">{k.label}</p>
                        <p className="font-bold text-base tabular-nums leading-tight" style={{ color: k.color }}>{k.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Результативность */}
                  <div>
                    <p className="text-primary font-semibold text-sm mb-3">Результативность разборов</p>
                    <div className="space-y-2">
                      {[
                        { label: `${violationPct}% нарушения выявлены`, pct: violationPct, color: '#D32B38' },
                        { label: `${cleanPct}% нарушений нет`,           pct: cleanPct,    color: '#1F9D57' },
                      ].map(bar => (
                        <div key={bar.label} className="flex items-center gap-3">
                          <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: bar.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${bar.pct}%` }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                            />
                          </div>
                          <span className="text-xs text-secondary shrink-0 w-40">{bar.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* По точкам */}
                  {byPoint.length > 0 && (
                    <div>
                      <p className="text-primary font-semibold text-sm mb-3">По точкам</p>
                      <div className="space-y-2">
                        {byPoint.map(({ name, count }) => (
                          <div key={name} className="flex items-center gap-3">
                            <span className="text-primary text-xs w-32 truncate shrink-0">{name}</span>
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                              <div
                                className="h-full rounded-full"
                                style={{ background: color, width: `${Math.round((count / byPoint[0].count) * 100)}%` }}
                              />
                            </div>
                            <span className="text-secondary text-xs tabular-nums w-5 text-right">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* По решению */}
                  {byResolution.length > 0 && (
                    <div>
                      <p className="text-primary font-semibold text-sm mb-3">По решению</p>
                      <div className="flex flex-wrap gap-2">
                        {byResolution.map(([res, cnt]) => (
                          <div key={res} className="px-3 py-1.5 rounded-lg flex items-center gap-2" style={{ background: 'var(--bg)', border: '1px solid var(--border-color)' }}>
                            <span className="text-primary text-xs">{res}</span>
                            <span className="text-xs font-bold tabular-nums" style={{ color }}>{cnt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* По типу */}
                  {byType.length > 0 && (
                    <div>
                      <p className="text-primary font-semibold text-sm mb-3">По типу обращения</p>
                      <div className="flex flex-wrap gap-2">
                        {byType.map(([type, cnt]) => (
                          <div key={type} className="px-3 py-1.5 rounded-lg flex items-center gap-2" style={{ background: 'var(--bg)', border: '1px solid var(--border-color)' }}>
                            <span className="text-primary text-xs">{type}</span>
                            <span className="text-xs font-bold tabular-nums" style={{ color }}>{cnt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Таблица всех записей */}
                  <div>
                    <p className="text-primary font-semibold text-sm mb-3">
                      Все записи ({myRows.length})
                    </p>
                    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
                      <table className="w-full text-xs">
                        <thead>
                          <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border-color)' }}>
                            {['Дата', 'Точка', 'Тип', 'Решение', 'Сумма'].map(h => (
                              <th key={h} className="text-secondary font-medium text-left px-3 py-2 first:pl-4 last:pr-4 last:text-right">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {myRows.map((r, i) => (
                            <tr key={i} className="border-t border-[var(--border-color)] hover:bg-accent/5 transition-colors">
                              <td className="px-3 py-2 pl-4 text-secondary whitespace-nowrap">{r.date}</td>
                              <td className="px-3 py-2 text-primary max-w-[120px] truncate">{r.point}</td>
                              <td className="px-3 py-2 text-secondary max-w-[100px] truncate">{r.type}</td>
                              <td className="px-3 py-2 text-primary">{r.resolution || '—'}</td>
                              <td className="px-3 py-2 pr-4 text-right tabular-nums whitespace-nowrap" style={{ color: r.refund ? '#D6850A' : 'var(--text-secondary)' }}>
                                {r.refund ? `${r.refund.toLocaleString('ru')} р` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}