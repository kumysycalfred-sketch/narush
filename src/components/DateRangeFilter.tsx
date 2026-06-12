import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DateRange } from '../types';

type Preset = 'today' | '7d' | '30d' | 'all' | 'custom';

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

function toInputDate(d: Date | null): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function rangeForPreset(preset: Exclude<Preset, 'custom'>): DateRange {
  const t = new Date();
  switch (preset) {
    case 'today': return { from: startOfDay(t), to: endOfDay(t) };
    case '7d':    return { from: startOfDay(new Date(t.getTime() - 6 * 86400000)), to: endOfDay(t) };
    case '30d':   return { from: startOfDay(new Date(t.getTime() - 29 * 86400000)), to: endOfDay(t) };
    case 'all':   return { from: null, to: null };
  }
}

const QUICK: { key: Exclude<Preset, 'custom'>; label: string }[] = [
  { key: 'today', label: 'Сегодня' },
  { key: '7d',    label: '7 дней' },
  { key: '30d',   label: '30 дней' },
  { key: 'all',   label: 'Всё время' },
];

const INPUT_CLASS =
  'px-2 py-1.5 rounded-lg bg-card border border-border text-primary text-xs focus:outline-none focus:ring-2 focus:ring-accent';

export default function DateRangeFilter({ value, onChange }: Props) {
  // preset is the source of truth for which button is active and whether custom panel is open.
  // Note: preset is local state — if the parent externally resets value, the highlighted button
  // won't update. In this app App.tsx only changes dateRange through this component, so they stay in sync.
  const [preset, setPreset] = useState<Preset>('all');

  const applyPreset = (p: Exclude<Preset, 'custom'>) => {
    setPreset(p);
    onChange(rangeForPreset(p));
  };

  const toggleCustom = () => {
    if (preset === 'custom') {
      // closing custom panel — reset to show-all
      setPreset('all');
      onChange({ from: null, to: null });
    } else {
      setPreset('custom');
      onChange({ from: null, to: null });
    }
  };

  const btn = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
      active
        ? 'bg-accent text-white shadow-sm'
        : 'text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5'
    }`;

  return (
    <div className="max-w-7xl mx-auto px-4 pb-2.5 flex flex-wrap items-center gap-1.5">
      {QUICK.map(({ key, label }) => (
        <button key={key} onClick={() => applyPreset(key)} className={btn(preset === key)}>
          {label}
        </button>
      ))}
      <button onClick={toggleCustom} className={btn(preset === 'custom')}>
        Свой ▾
      </button>

      <AnimatePresence>
        {preset === 'custom' && (
          <motion.div
            key="custom-inputs"
            initial={{ opacity: 0, scaleY: 0.8 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.8 }}
            style={{ transformOrigin: 'top left' }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2 basis-full sm:basis-auto"
          >
            <input
              type="date"
              value={toInputDate(value.from)}
              onChange={e => onChange({ ...value, from: e.target.value ? startOfDay(new Date(e.target.value + 'T00:00:00')) : null })}
              className={INPUT_CLASS}
            />
            <span className="text-secondary text-xs">—</span>
            <input
              type="date"
              value={toInputDate(value.to)}
              onChange={e => onChange({ ...value, to: e.target.value ? endOfDay(new Date(e.target.value + 'T00:00:00')) : null })}
              className={INPUT_CLASS}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
