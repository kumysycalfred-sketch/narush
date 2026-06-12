# Dashboard Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global date-range filter, improve UI across all components, and add unified employee search on the Staff page.

**Architecture:** Date filter state lives in `App.tsx` and is applied before passing rows to pages. UI improvements are self-contained changes inside existing component files. Employee search state lives in `Staff.tsx` and filters the data that feeds cards, chart, and table together.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Framer Motion, Vitest

---

## File Map

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `DateRange` interface; extend `KpiItem` with `icon?` and `trend?` |
| `src/utils/aggregate.ts` | Add `filterByDate` helper |
| `src/tests/aggregate.test.ts` | Add tests for `filterByDate` |
| `src/components/DateRangeFilter.tsx` | **New** — combo date filter (quick presets + custom range) |
| `src/components/Layout.tsx` | Accept `dateRange` + `onDateChange` props; render `DateRangeFilter` |
| `src/App.tsx` | Add `dateRange` state; apply `filterByDate`; pass `dateRange` to Layout |
| `src/components/KpiCard.tsx` | Add `icon` and `trend` props |
| `src/components/DataTable.tsx` | Sticky header, row hover highlight |
| `src/components/EmployeeCard.tsx` | Add `maxCount` prop, progress bar, hover lift |
| `src/components/PointCard.tsx` | Add `maxCount` prop, progress bar, hover lift |
| `src/pages/Overview.tsx` | Pass KPI icons; active filter count badge; always-visible reset |
| `src/pages/Staff.tsx` | Employee search; pass KPI icons + `maxCount`; active filter count |
| `src/pages/Points.tsx` | Pass KPI icons + `maxCount`; active filter count; always-visible reset |

---

## Task 1: DateRange type + filterByDate utility (TDD)

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/utils/aggregate.ts`
- Modify: `src/tests/aggregate.test.ts`

- [ ] **Step 1: Add DateRange to types**

In `src/types/index.ts`, add after the last export:

```ts
export interface DateRange {
  from: Date | null;
  to: Date | null;
}
```

- [ ] **Step 2: Write failing tests for filterByDate**

Add to the bottom of `src/tests/aggregate.test.ts`:

```ts
import { filterByDate } from '../utils/aggregate';

describe('filterByDate', () => {
  const r = (date: string) => ({ ...base, date });

  it('returns all rows when range is empty', () => {
    expect(filterByDate([r('01.06.2026'), r('15.06.2026')], { from: null, to: null })).toHaveLength(2);
  });

  it('excludes rows before from date', () => {
    const from = new Date(2026, 5, 5, 0, 0, 0); // June 5
    const result = filterByDate([r('04.06.2026'), r('05.06.2026'), r('06.06.2026')], { from, to: null });
    expect(result.map(x => x.date)).toEqual(['05.06.2026', '06.06.2026']);
  });

  it('excludes rows after to date', () => {
    const to = new Date(2026, 5, 5, 23, 59, 59); // June 5 end
    const result = filterByDate([r('04.06.2026'), r('05.06.2026'), r('06.06.2026')], { from: null, to });
    expect(result.map(x => x.date)).toEqual(['04.06.2026', '05.06.2026']);
  });

  it('passes through rows with unparseable dates', () => {
    const result = filterByDate([r('')], { from: new Date(), to: new Date() });
    expect(result).toHaveLength(1);
  });

  it('passes through rows with 2-part dates (no year)', () => {
    const result = filterByDate([r('01.06')], { from: new Date(), to: new Date() });
    expect(result).toHaveLength(1);
  });

  it('handles YY year format', () => {
    const from = new Date(2026, 5, 1, 0, 0, 0);
    const to = new Date(2026, 5, 30, 23, 59, 59);
    const result = filterByDate([r('15.06.26'), r('15.07.26')], { from, to });
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('15.06.26');
  });
});
```

- [ ] **Step 3: Run tests to confirm they fail**

```
npm test
```

Expected: FAIL — `filterByDate is not a function`

- [ ] **Step 4: Implement filterByDate in aggregate.ts**

Add at the bottom of `src/utils/aggregate.ts`:

```ts
import { DateRange } from '../types';

function parseSheetDate(d: string): Date | null {
  if (!d?.trim()) return null;
  const parts = d.split('.');
  if (parts.length < 3) return null;
  const [dd, mm, yy] = parts;
  const year = yy.length === 2 ? 2000 + parseInt(yy, 10) : parseInt(yy, 10);
  const date = new Date(year, parseInt(mm, 10) - 1, parseInt(dd, 10));
  return isNaN(date.getTime()) ? null : date;
}

export function filterByDate(rows: SheetRow[], range: DateRange): SheetRow[] {
  if (!range.from && !range.to) return rows;
  return rows.filter(r => {
    const d = parseSheetDate(r.date);
    if (!d) return true;
    if (range.from && d < range.from) return false;
    if (range.to && d > range.to) return false;
    return true;
  });
}
```

Note: `DateRange` import must be added to the existing `import { SheetRow, EmployeeStats, PointStats } from '../types';` line.

- [ ] **Step 5: Run tests to confirm they pass**

```
npm test
```

Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/utils/aggregate.ts src/tests/aggregate.test.ts
git commit -m "feat: add DateRange type and filterByDate utility"
```

---

## Task 2: DateRangeFilter component

**Files:**
- Create: `src/components/DateRangeFilter.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/DateRangeFilter.tsx`:

```tsx
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
  const [preset, setPreset]       = useState<Preset>('all');
  const [showCustom, setShowCustom] = useState(false);

  const applyPreset = (p: Exclude<Preset, 'custom'>) => {
    setPreset(p);
    setShowCustom(false);
    onChange(rangeForPreset(p));
  };

  const toggleCustom = () => {
    setPreset('custom');
    setShowCustom(s => !s);
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
        {showCustom && (
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
              onChange={e => onChange({ ...value, from: e.target.value ? new Date(e.target.value + 'T00:00:00') : null })}
              className={INPUT_CLASS}
            />
            <span className="text-secondary text-xs">—</span>
            <input
              type="date"
              value={toInputDate(value.to)}
              onChange={e => onChange({ ...value, to: e.target.value ? new Date(e.target.value + 'T23:59:59') : null })}
              className={INPUT_CLASS}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DateRangeFilter.tsx
git commit -m "feat: add DateRangeFilter combo component"
```

---

## Task 3: Wire global date filter into App + Layout

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/Layout.tsx`

- [ ] **Step 1: Update App.tsx**

Replace the full contents of `src/App.tsx`:

```tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SheetRow, Tab, DateRange } from './types';
import { fetchSheet } from './api/fetchSheet';
import { parseRows } from './utils/parse';
import { filterByDate } from './utils/aggregate';
import { useTheme } from './hooks/useTheme';
import Layout from './components/Layout';
import { SkeletonPage } from './components/Skeleton';
import Overview from './pages/Overview';
import Staff from './pages/Staff';
import Points from './pages/Points';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

function ErrorBanner({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="bg-danger/10 border border-danger/30 rounded-xl p-6 text-center space-y-3">
      <p className="text-danger font-medium">Ошибка загрузки данных</p>
      <p className="text-secondary text-sm">{error}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent/90 transition-colors active:scale-95"
      >
        Повторить
      </button>
    </div>
  );
}

export default function App() {
  const { dark, toggle } = useTheme();
  const [tab, setTab]               = useState<Tab>('overview');
  const [rows, setRows]             = useState<SheetRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [updatedAt, setUpdatedAt]   = useState<string | null>(null);
  const [dateRange, setDateRange]   = useState<DateRange>({ from: null, to: null });

  const load = useCallback(async () => {
    try {
      const { csv, updatedAt: ua } = await fetchSheet();
      setRows(parseRows(csv));
      setUpdatedAt(ua);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [load]);

  const dateFiltered = useMemo(() => filterByDate(rows, dateRange), [rows, dateRange]);

  return (
    <Layout
      tab={tab} setTab={setTab}
      dark={dark} toggleTheme={toggle}
      updatedAt={updatedAt}
      dateRange={dateRange} onDateChange={setDateRange}
    >
      {loading ? (
        <SkeletonPage />
      ) : error ? (
        <ErrorBanner error={error} onRetry={load} />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            variants={pageVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            {tab === 'overview' && <Overview rows={dateFiltered} />}
            {tab === 'staff'    && <Staff rows={dateFiltered} />}
            {tab === 'points'   && <Points rows={dateFiltered} />}
          </motion.div>
        </AnimatePresence>
      )}
    </Layout>
  );
}
```

- [ ] **Step 2: Update Layout.tsx**

Replace the full contents of `src/components/Layout.tsx`:

```tsx
import { ReactNode } from 'react';
import { Tab, DateRange } from '../types';
import DateRangeFilter from './DateRangeFilter';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Обзор' },
  { key: 'staff',    label: 'Сотрудники' },
  { key: 'points',   label: 'Точки' },
];

interface LayoutProps {
  tab: Tab;
  setTab: (t: Tab) => void;
  dark: boolean;
  toggleTheme: () => void;
  updatedAt: string | null;
  dateRange: DateRange;
  onDateChange: (r: DateRange) => void;
  children: ReactNode;
}

export default function Layout({ tab, setTab, dark, toggleTheme, updatedAt, dateRange, onDateChange, children }: LayoutProps) {
  const timeLabel = updatedAt
    ? new Date(updatedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="min-h-screen bg-base transition-colors duration-300">
      <header
        className="sticky top-0 z-20 backdrop-blur-xl border-b transition-colors duration-300"
        style={{
          backgroundColor: dark ? 'rgba(10, 14, 26, 0.75)' : 'rgba(255, 255, 255, 0.85)',
          borderBottomColor: dark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(226, 232, 240, 1)',
          boxShadow: dark
            ? '0 1px 0 rgba(99, 102, 241, 0.12), 0 4px 24px rgba(0,0,0,0.3)'
            : '0 1px 0 rgba(0,0,0,0.06)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="w-2 h-6 rounded-full"
              style={{ background: 'linear-gradient(180deg, #6366F1, #A78BFA)' }}
            />
            <button
              onClick={() => setTab('overview')}
              className="flex flex-col items-start leading-none group cursor-pointer"
              aria-label="На главную"
            >
              <span className="font-mono text-[10px] tracking-widest uppercase select-none transition-opacity duration-200"
                style={{ color: dark ? 'rgba(167,139,250,0.55)' : 'rgba(99,102,241,0.5)', letterSpacing: '0.18em' }}>
                by LNFRG
              </span>
              <h1 className="text-primary font-semibold text-lg tracking-tight mt-0.5 group-hover:text-accent transition-colors duration-200">
                Контроль качества
              </h1>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {timeLabel && (
              <span className="text-secondary text-xs font-mono hidden sm:block opacity-70">
                обновлено {timeLabel}
              </span>
            )}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-all duration-200 active:scale-95 text-base"
              style={{
                background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                color: 'var(--text-secondary)',
              }}
              aria-label="Переключить тему"
            >
              {dark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        <nav className="max-w-7xl mx-auto px-4 flex gap-1 pb-2">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={tab === key ? {
                background: dark
                  ? 'linear-gradient(135deg, rgba(99,102,241,0.35), rgba(167,139,250,0.2))'
                  : '#6366F1',
                color: '#FFFFFF',
                boxShadow: dark ? '0 0 16px rgba(99,102,241,0.3)' : 'none',
              } : {
                color: 'var(--text-secondary)',
                background: 'transparent',
              }}
              onMouseEnter={e => {
                if (tab !== key) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={e => {
                if (tab !== key) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                }
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        <DateRangeFilter value={dateRange} onChange={onDateChange} />
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Run tests to confirm nothing broke**

```
npm test
```

Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/Layout.tsx
git commit -m "feat: wire global date range filter into App and Layout"
```

---

## Task 4: KpiCard icons + trend

**Files:**
- Modify: `src/components/KpiCard.tsx`
- Modify: `src/pages/Overview.tsx`
- Modify: `src/pages/Staff.tsx`
- Modify: `src/pages/Points.tsx`

- [ ] **Step 1: Update KpiCard.tsx**

Replace full contents of `src/components/KpiCard.tsx`:

```tsx
import { useCountUp } from '../hooks/useCountUp';

export interface KpiItem {
  label: string;
  value: number;
  sub?: string;
  color?: string;
  format?: 'number' | 'currency' | 'percent';
  icon?: string;
  trend?: number;
}

export default function KpiCard({ label, value, sub, color = '#3F3DC4', format = 'number', icon, trend }: KpiItem) {
  const animated = useCountUp(value);

  const display =
    format === 'currency'
      ? animated.toLocaleString('ru-RU') + ' ₽'
      : format === 'percent'
      ? animated + '%'
      : animated.toLocaleString('ru-RU');

  return (
    <div className="bg-card rounded-xl p-4 relative overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
        style={{ backgroundColor: color }}
      />
      <div className="pl-3">
        <div className="flex items-start justify-between mb-1 gap-1">
          <p className="text-secondary text-xs leading-tight">{label}</p>
          {icon && <span className="text-sm opacity-50 shrink-0">{icon}</span>}
        </div>
        <div className="flex items-end gap-2">
          <p className="font-mono text-2xl font-semibold text-primary leading-none">{display}</p>
          {trend !== undefined && trend !== 0 && (
            <span className={`text-xs font-mono mb-0.5 leading-none ${trend > 0 ? 'text-danger' : 'text-success'}`}>
              {trend > 0 ? '↑' : '↓'}{Math.abs(trend)}%
            </span>
          )}
        </div>
        {sub && <p className="text-secondary text-xs mt-1 leading-tight">{sub}</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update KPI items in Overview.tsx**

In `src/pages/Overview.tsx`, replace the `kpis` array (lines ~37–47):

```ts
const kpis = [
  { label: 'Всего записей',    value: filtered.length,           color: '#3F3DC4', icon: '📋' },
  {
    label: 'Отзывов гостей',   value: guestRows.length,
    sub: `доп/адм: ${filtered.length - guestRows.length}`,
    color: '#6B7280',          icon: '💬',
  },
  { label: 'С нарушениями',    value: withViolation.length,      color: '#D32B38', icon: '⚠️' },
  { label: 'Сумма возвратов',  value: sumRefund(filtered), format: 'currency' as const, color: '#D6850A', icon: '💰' },
  { label: 'Без нарушений',    value: cleanPct, format: 'percent' as const, color: '#1F9D57', icon: '✅' },
];
```

- [ ] **Step 3: Update KPI items in Staff.tsx**

In `src/pages/Staff.tsx`, replace the `kpis` array (lines ~34–40):

```ts
const kpis = [
  { label: 'Записей с ФИО',          value: filtered.length,    color: '#3F3DC4', icon: '📋' },
  { label: 'Уникальных сотрудников', value: stats.length,       color: '#6B7280', icon: '👥' },
  { label: 'Лишений премии',         value: penaltyCount,       color: '#D32B38', icon: '❌' },
  { label: 'Сумма возвратов',        value: sumRefund(filtered), format: 'currency' as const, color: '#D6850A', icon: '💰' },
  { label: 'Прощений',               value: forgivenCount,      color: '#1F9D57', icon: '🤝' },
];
```

- [ ] **Step 4: Update KPI items in Points.tsx**

In `src/pages/Points.tsx`, replace the `kpis` array (lines ~25–42):

```ts
const kpis = [
  { label: 'Всего точек',   value: stats.length,         color: '#3F3DC4', icon: '📍' },
  {
    label: 'Точка-лидер',   value: leader?.count ?? 0,
    sub: leader?.name,      color: '#D32B38',             icon: '🏆',
  },
  {
    label: 'Макс. возвраты', value: maxRefund?.refund ?? 0,
    sub: maxRefund?.name,   format: 'currency' as const,  color: '#D6850A', icon: '💰',
  },
  { label: 'Всего записей', value: filtered.length,       color: '#6B7280', icon: '📊' },
  { label: 'Без нарушений', value: totalClean,             color: '#1F9D57', icon: '✅' },
];
```

- [ ] **Step 5: Commit**

```bash
git add src/components/KpiCard.tsx src/pages/Overview.tsx src/pages/Staff.tsx src/pages/Points.tsx
git commit -m "feat: add icons and trend support to KpiCard"
```

---

## Task 5: DataTable sticky header + row hover

**Files:**
- Modify: `src/components/DataTable.tsx`

- [ ] **Step 1: Add sticky header and row hover**

In `src/components/DataTable.tsx`:

1. Wrap the `<div className="overflow-x-auto">` in an outer div with `max-h-[600px] overflow-y-auto`:

```tsx
<div className="bg-card rounded-xl overflow-hidden">
  <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
    <table className="w-full text-sm">
```

2. Update `<thead>` to be sticky with a solid background:

```tsx
<thead className="sticky top-0 z-10">
  <tr
    className="border-b border-[var(--border-color)]"
    style={{ backgroundColor: 'var(--bg-base)' }}
  >
```

3. Add hover to each data row. Replace the `className` on `<motion.tr>`:

```tsx
className={`border-b border-[var(--border-color)] last:border-0 hover:bg-accent/5 transition-colors duration-100 ${
  i % 2 === 0 ? '' : 'bg-[var(--bg-base)]'
}`}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DataTable.tsx
git commit -m "feat: sticky header and hover highlight in DataTable"
```

---

## Task 6: EmployeeCard + PointCard progress bars and hover lift

**Files:**
- Modify: `src/components/EmployeeCard.tsx`
- Modify: `src/components/PointCard.tsx`
- Modify: `src/pages/Staff.tsx`
- Modify: `src/pages/Points.tsx`

- [ ] **Step 1: Update EmployeeCard.tsx**

Replace full contents of `src/components/EmployeeCard.tsx`:

```tsx
import { EmployeeStats } from '../types';

interface Props {
  stats: EmployeeStats;
  maxCount: number;
  onClick: () => void;
}

export default function EmployeeCard({ stats, onClick, maxCount }: Props) {
  const topCategories = Object.entries(stats.byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2);

  const hasPenalty  = stats.meta3p['Лишение премии'] > 0;
  const hasForgiven = stats.meta3p['Прощение'] > 0;
  const pct         = maxCount > 0 ? Math.round((stats.count / maxCount) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-card rounded-xl p-3.5 border border-border hover:border-accent/40 hover:shadow-md hover:-translate-y-1 transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-accent/50"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-primary font-semibold text-sm leading-tight truncate">{stats.name}</p>
          <p className="text-secondary text-xs truncate">{stats.position}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono text-lg font-bold text-danger leading-none">{stats.count}</p>
          {stats.refund > 0 && (
            <p className="font-mono text-xs text-warning">{stats.refund.toLocaleString('ru-RU')} ₽</p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden mb-2">
        <div
          className="h-full rounded-full bg-danger/50 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {topCategories.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {topCategories.map(([cat, count]) => (
            <span key={cat} className="text-xs px-1.5 py-0.5 rounded-md bg-accent/10 text-accent font-mono truncate max-w-full">
              {cat}: {count}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-1.5 flex-wrap">
        {hasPenalty && (
          <span className="text-xs px-1.5 py-0.5 rounded-md bg-warning/10 text-warning font-mono">
            −премия: {stats.meta3p['Лишение премии']}
          </span>
        )}
        {hasForgiven && (
          <span className="text-xs px-1.5 py-0.5 rounded-md bg-success/10 text-success font-mono">
            прощение: {stats.meta3p['Прощение']}
          </span>
        )}
      </div>
    </button>
  );
}
```

- [ ] **Step 2: Update PointCard.tsx**

Replace full contents of `src/components/PointCard.tsx`:

```tsx
import { PointStats } from '../types';

interface Props {
  stats: PointStats;
  maxCount: number;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-secondary text-xs font-semibold uppercase tracking-wider mb-2">{title}</p>
      {children}
    </div>
  );
}

export default function PointCard({ stats, maxCount }: Props) {
  const sortedEntries = (r: Record<string, number>) =>
    Object.entries(r).sort(([, a], [, b]) => b - a);

  const pct = maxCount > 0 ? Math.round((stats.count / maxCount) * 100) : 0;

  return (
    <div className="bg-card rounded-xl p-5 space-y-4 border border-border hover:border-accent/30 hover:shadow-md hover:-translate-y-1 transition-all duration-200">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-primary font-semibold leading-tight">{stats.name}</h3>
          {stats.refund > 0 && (
            <p className="font-mono text-xs text-warning mt-0.5">
              возвраты: {stats.refund.toLocaleString('ru-RU')} ₽
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono text-xl font-bold text-danger">{stats.count}</p>
          {stats.cleanCount > 0 && (
            <p className="font-mono text-xs text-success">✓ {stats.cleanCount} чисто</p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-danger/50 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {Object.keys(stats.byCategory).length > 0 && (
        <Section title="Категории">
          <div className="flex flex-wrap gap-1.5">
            {sortedEntries(stats.byCategory).map(([cat, count]) => (
              <span key={cat} className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-mono">
                {cat}: {count}
              </span>
            ))}
          </div>
        </Section>
      )}

      {Object.keys(stats.violations).length > 0 && (
        <Section title="Грубые нарушения">
          <div className="space-y-1">
            {sortedEntries(stats.violations).map(([v, count]) => (
              <div key={v} className="flex justify-between text-sm gap-2">
                <span className="text-primary truncate">{v}</span>
                <span className="font-mono text-danger font-semibold shrink-0">{count}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {Object.keys(stats.misdemeanors).length > 0 && (
        <Section title="Проступки">
          <div className="space-y-1">
            {sortedEntries(stats.misdemeanors).map(([m, count]) => (
              <div key={m} className="flex justify-between text-sm gap-2">
                <span className="text-primary truncate">{m}</span>
                <span className="font-mono text-warning font-semibold shrink-0">{count}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Pass maxCount in Staff.tsx**

In `src/pages/Staff.tsx`:

1. Add after `const top25 = stats.slice(0, 25);`:
```ts
const maxCount = useMemo(() => stats.reduce((m, s) => Math.max(m, s.count), 0), [stats]);
```

2. Update EmployeeCard usage inside the grid (replace `<EmployeeCard key={s.name} stats={s} onClick={() => setSelected(s)} />`):
```tsx
<EmployeeCard key={s.name} stats={s} maxCount={maxCount} onClick={() => setSelected(s)} />
```

- [ ] **Step 4: Pass maxCount in Points.tsx**

In `src/pages/Points.tsx`:

1. Add after `const top12 = stats.slice(0, 12);`:
```ts
const maxCount = useMemo(() => stats.reduce((m, s) => Math.max(m, s.count), 0), [stats]);
```

2. Update PointCard usage (replace `<PointCard stats={s} />`):
```tsx
<PointCard stats={s} maxCount={maxCount} />
```

- [ ] **Step 5: Run tests**

```
npm test
```

Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/EmployeeCard.tsx src/components/PointCard.tsx src/pages/Staff.tsx src/pages/Points.tsx
git commit -m "feat: progress bars and hover lift on employee and point cards"
```

---

## Task 7: Filter panel improvements + employee search

**Files:**
- Modify: `src/pages/Overview.tsx`
- Modify: `src/pages/Staff.tsx`
- Modify: `src/pages/Points.tsx`

- [ ] **Step 1: Update Overview.tsx filter panel**

In `src/pages/Overview.tsx`, replace the filter panel `<div>` block (the `bg-card rounded-xl p-4 flex...` div):

```tsx
{/* Фильтры */}
<div className="bg-card rounded-xl p-4 flex flex-wrap gap-3 items-center">
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
    {hasFilter && (
      <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center shrink-0">
        {[filterType, filterObject, filterPoint].filter(Boolean).length}
      </span>
    )}
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
```

- [ ] **Step 2: Update Staff.tsx — employee search + filter improvements**

In `src/pages/Staff.tsx`:

1. Add `searchQuery` state after existing state declarations:
```ts
const [searchQuery, setSearchQuery] = useState('');
```

2. Add `searched` memo after `filtered`:
```ts
const searched = useMemo(() =>
  searchQuery.trim()
    ? filtered.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.position.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filtered,
  [filtered, searchQuery]
);
```

3. Replace all uses of `filtered` in derived memos/values with `searched`:
```ts
const stats         = useMemo(() => buildEmployeeStats(searched), [searched]);
const penaltyCount  = useMemo(() => searched.filter(r => r.meta3p === 'Лишение премии').length, [searched]);
const forgivenCount = useMemo(() => searched.filter(r => r.meta3p === 'Прощение').length, [searched]);
const top15         = useMemo(() => topN(countBy(searched, r => r.name), 15), [searched]);
```

4. Keep KPI `value: filtered.length` on the first item (total records before search), change others to use `searched`:
```ts
const kpis = [
  { label: 'Записей с ФИО',          value: searched.length,    color: '#3F3DC4', icon: '📋' },
  { label: 'Уникальных сотрудников', value: stats.length,       color: '#6B7280', icon: '👥' },
  { label: 'Лишений премии',         value: penaltyCount,       color: '#D32B38', icon: '❌' },
  { label: 'Сумма возвратов',        value: sumRefund(searched), format: 'currency' as const, color: '#D6850A', icon: '💰' },
  { label: 'Прощений',               value: forgivenCount,      color: '#1F9D57', icon: '🤝' },
];
```

5. Update `reset` and `hasFilter`:
```ts
const reset     = () => { setFilterPosition(''); setFilterPoint(''); setSearchQuery(''); };
const hasFilter = filterPosition || filterPoint || searchQuery;
const activeFilterCount = [filterPosition, filterPoint, searchQuery].filter(Boolean).length;
```

6. Replace the filter panel `<div>` block:
```tsx
<div className="bg-card rounded-xl p-4 flex flex-wrap gap-3 items-center">
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
      className="w-full pl-8 pr-3 py-2 rounded-lg bg-card border border-[var(--border-color)] text-primary text-sm placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
    />
  </div>
  <div className="flex items-center gap-2">
    {hasFilter && (
      <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center shrink-0">
        {activeFilterCount}
      </span>
    )}
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
```

7. Update the DataTable rows label and data source:
```tsx
<h2 className="text-primary font-semibold mb-4">
  Все записи с ФИО ({searched.length})
</h2>
<DataTable rows={searched} />
```

- [ ] **Step 3: Update Points.tsx filter panel**

In `src/pages/Points.tsx`, replace the filter panel block:

```tsx
<div className="bg-card rounded-xl p-4 flex flex-wrap gap-3 items-center">
  <select className={SELECT_CLASS} value={filterObject} onChange={e => setFilterObject(e.target.value)}>
    <option value="">Все объекты</option>
    {['Кухня', 'Бар', 'Цех', 'Поставщик'].map(o => <option key={o} value={o}>{o}</option>)}
  </select>
  <div className="flex items-center gap-2">
    {filterObject && (
      <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center shrink-0">
        1
      </span>
    )}
    <button
      onClick={() => setFilterObject('')}
      className={`text-secondary text-sm hover:text-primary underline transition-opacity ${
        filterObject ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      Сбросить
    </button>
  </div>
</div>
```

- [ ] **Step 4: Run all tests**

```
npm test
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/Overview.tsx src/pages/Staff.tsx src/pages/Points.tsx
git commit -m "feat: employee search, active filter badges, improved filter panels"
```
