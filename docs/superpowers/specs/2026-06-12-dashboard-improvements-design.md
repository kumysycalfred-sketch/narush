# Dashboard Improvements Design
Date: 2026-06-12

## Overview

Three independent improvements to the quality-control dashboard:
1. Global date-range filter (combo: quick buttons + custom range)
2. UI polish across all components
3. Unified employee search on the Staff page

---

## 1. Date Range Filter

### Behavior
- Lives in `App.tsx` as shared state `dateRange: { from: Date | null; to: Date | null }`
- Passed to all three pages (Overview, Staff, Points) as a prop; filtering applied before pages receive `rows`
- A helper `filterByDate(rows, dateRange)` in `utils/aggregate.ts` handles the logic

### Component: `DateRangeFilter`
New file: `src/components/DateRangeFilter.tsx`

Rendered inside `Layout` header (below nav tabs, or in the filter panel area).

UI:
- Four quick-select buttons: **Сегодня / 7 дней / 30 дней / Всё время**
- Button **Свой** toggles a custom range panel (animated expand via framer-motion)
- Custom range panel: two `<input type="date">` fields (от / до)
- Active quick button is highlighted with accent color
- When a custom range is active, **Свой** button shows as active
- Selecting a quick button clears the custom inputs

### Date parsing
`SheetRow.date` is in `DD.MM.YYYY` or `DD.MM.YY` format. The filter converts each row date to a `Date` object for comparison. Rows with unparseable dates pass through unfiltered.

### Interface changes
```ts
// types/index.ts — new type
export interface DateRange { from: Date | null; to: Date | null }

// App.tsx — new state
const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });

// Pages receive filtered rows
const dateFiltered = filterByDate(rows, dateRange);
// Pass dateFiltered (not rows) to Overview, Staff, Points

// Layout.tsx — LayoutProps extended
interface LayoutProps {
  // ...existing props...
  dateRange: DateRange;
  onDateChange: (r: DateRange) => void;
}
// Layout renders <DateRangeFilter> below the nav tabs
```

---

## 2. UI Improvements

### 2a. KPI Cards (`KpiCard.tsx`)
- Add optional `icon` prop (string — emoji or symbol) rendered top-left of the card
- Add optional `trend` prop (`number` — positive = up, negative = down, zero = neutral)
- When `trend` is provided: show `↑` (green) or `↓` (red) with the percentage value next to the main number
- Colored bottom border (3px) using the existing `color` prop — already has color, just add `borderBottom`
- Callers (`Overview.tsx`, `Staff.tsx`, `Points.tsx`) updated to pass icons for each KPI item

KPI icon mapping:
- Всего записей → `📋`
- Отзывов гостей → `💬`
- С нарушениями → `⚠️`
- Сумма возвратов → `💰`
- Без нарушений → `✅`
- Уникальных сотрудников → `👥`
- Лишений премии → `❌`
- Прощений → `🤝`
- Всего точек → `📍`
- Точка-лидер → `🏆`

### 2b. DataTable (`DataTable.tsx`)
- `<thead>` gets `position: sticky; top: 0; z-index: 10` with opaque background
- Alternating row backgrounds: `even:bg-black/5 dark:even:bg-white/[0.03]`
- Row hover: `hover:bg-accent/5 cursor-default transition-colors`
- Sortable columns: `date`, `point`, `name`, `refund`
  - Click column header to sort ascending; click again for descending
  - Sort state: `{ key: SortKey; dir: 'asc' | 'desc' }` local to `DataTable`
  - Sort icon: `↑` / `↓` / `↕` (unsorted) next to column label

### 2c. Employee & Point Cards

**EmployeeCard (`EmployeeCard.tsx`)**
- Badge: top 1 category from `stats.byCategory` (most frequent) shown as a small pill below the name
- Mini progress bar: width = `(stats.count / maxCount) * 100%` — requires `maxCount` prop passed from `Staff.tsx`
- Hover: `hover:-translate-y-1 hover:shadow-lg transition-all duration-200`

**PointCard (`PointCard.tsx`)**
- Same treatment: top category badge, progress bar (relative to max point count), hover lift
- `maxCount` prop from `Points.tsx`

### 2d. Filter Panels (Overview, Staff, Points)

- Active filter count badge: a small purple circle with number next to the panel, e.g. `Фильтры (2)`; hidden when count = 0
- Reset button: always rendered, `opacity-0 pointer-events-none` when no filters active (prevents layout shift)
- `<select>` elements: add explicit `cursor-pointer` and improve focus ring styling via Tailwind

---

## 3. Employee Search

### Location
Inside the filter panel on `Staff.tsx`, after the existing dropdowns. The field stretches to fill remaining horizontal space (`flex-1`).

### Behavior
- State: `searchQuery: string` in `Staff.tsx`
- Applied to `filtered` rows (after position + point filters):
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
- `searched` replaces `filtered` as the data source for: `buildEmployeeStats`, `top15` chart, employee cards, `DataTable`
- Reset button clears `searchQuery` too

### UI
- `<input type="text" placeholder="Поиск по имени или должности...">` with search icon (🔍) as prefix inside the input (via relative positioning)
- Styled consistently with existing filter elements
- Shows result count: existing `filtered.length` label updates to `searched.length`

---

## Files Changed

| File | Change |
|------|--------|
| `src/App.tsx` | Add `dateRange` state, `filterByDate` call, pass to pages |
| `src/utils/aggregate.ts` | Add `filterByDate` helper |
| `src/components/DateRangeFilter.tsx` | **New** — combo date filter component |
| `src/components/Layout.tsx` | Accept and render `DateRangeFilter` |
| `src/types/index.ts` | Add `DateRange` type; update `KpiItem` with `icon?` and `trend?` |
| `src/components/KpiCard.tsx` | Add icon, trend, bottom border |
| `src/components/KpiRow.tsx` | Pass `maxCount` if needed |
| `src/components/DataTable.tsx` | Sticky header, striping, sorting, hover |
| `src/components/EmployeeCard.tsx` | Badge, progress bar, hover lift; add `maxCount` prop |
| `src/components/PointCard.tsx` | Badge, progress bar, hover lift; add `maxCount` prop |
| `src/pages/Overview.tsx` | Filter count badge, always-visible reset, KPI icons |
| `src/pages/Staff.tsx` | Search field, filter count badge, pass `maxCount` to cards, KPI icons |
| `src/pages/Points.tsx` | Filter count badge, always-visible reset, pass `maxCount` to cards, KPI icons |
