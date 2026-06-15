import { motion, AnimatePresence } from 'framer-motion';
import { SheetRow } from '../types';

interface Props {
  date: string | null;
  records: SheetRow[];
  onClose: () => void;
}

export default function DayRecordsModal({ date, records, onClose }: Props) {
  return (
    <AnimatePresence>
      {date && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            className="relative rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Шапка */}
            <div className="px-6 py-5 flex items-center gap-4 shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ background: 'var(--bg-elevated)' }}>
                📅
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-primary font-bold text-lg">{date}</p>
                <p className="text-secondary text-sm">{records.length} записей</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:text-primary hover:bg-accent/10 transition-colors shrink-0 text-lg"
              >
                ✕
              </button>
            </div>

            {/* Тело */}
            <div className="overflow-y-auto flex-1">
              {records.length === 0 ? (
                <p className="text-secondary text-center py-12 text-sm">Нет записей</p>
              ) : (
                <table className="w-full text-xs">
                  <thead className="sticky top-0" style={{ background: 'var(--bg-card)' }}>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      {['Точка', 'Тип', 'ФИО', 'Обработал', 'Решение', 'Сумма'].map(col => (
                        <th key={col} className="text-secondary font-medium text-left px-3 py-2.5 first:pl-5 last:pr-5 last:text-right whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, i) => (
                      <motion.tr
                        key={i}
                        className="border-t border-[var(--border-color)] hover:bg-accent/5 transition-colors"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.015 }}
                      >
                        <td className="px-3 py-2.5 pl-5 text-primary font-medium max-w-[120px] truncate">{r.point || '—'}</td>
                        <td className="px-3 py-2.5 text-secondary max-w-[100px] truncate">{r.type || '—'}</td>
                        <td className="px-3 py-2.5 text-primary max-w-[120px] truncate">{r.name || '—'}</td>
                        <td className="px-3 py-2.5 text-secondary max-w-[100px] truncate">{r.processor || <span className="italic opacity-50">не обработан</span>}</td>
                        <td className="px-3 py-2.5">
                          {r.resolution ? (
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                              style={{
                                background: r.resolution === 'Нарушений нет' ? 'rgba(66,183,122,0.15)' : 'rgba(232,64,64,0.15)',
                              color:      r.resolution === 'Нарушений нет' ? '#42B77A' : '#E84040',
                              }}
                            >
                              {r.resolution}
                            </span>
                          ) : (
                            <span className="text-secondary opacity-40">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 pr-5 text-right tabular-nums whitespace-nowrap" style={{ color: r.refund ? '#D6850A' : 'var(--text-secondary)' }}>
                          {r.refund ? `${r.refund.toLocaleString('ru')} р` : '—'}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}