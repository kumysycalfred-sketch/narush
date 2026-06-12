import { SheetRow, EmployeeStats, PointStats, DateRange } from '../types';

export function countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
  return items.reduce((acc, item) => {
    const k = key(item);
    if (k) acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export function topN(record: Record<string, number>, n: number): { name: string; count: number }[] {
  return Object.entries(record)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([name, count]) => ({ name, count }));
}

export function buildEmployeeStats(rows: SheetRow[]): EmployeeStats[] {
  const map = new Map<string, EmployeeStats>();
  rows.filter(r => r.name).forEach(r => {
    if (!map.has(r.name)) {
      map.set(r.name, {
        name: r.name, position: r.position,
        count: 0, refund: 0,
        byPoint: {}, byCategory: {}, violations: {}, misdemeanors: {}, meta3p: {},
      });
    }
    const s = map.get(r.name)!;
    s.count++;
    s.refund += r.refund;
    if (r.point) s.byPoint[r.point] = (s.byPoint[r.point] || 0) + 1;
    r.categories.forEach(c => { s.byCategory[c] = (s.byCategory[c] || 0) + 1; });
    r.violations.forEach(v => { s.violations[v] = (s.violations[v] || 0) + 1; });
    r.misdemeanors.forEach(m => { s.misdemeanors[m] = (s.misdemeanors[m] || 0) + 1; });
    if (r.meta3p) s.meta3p[r.meta3p] = (s.meta3p[r.meta3p] || 0) + 1;
  });
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export function buildPointStats(rows: SheetRow[]): PointStats[] {
  const map = new Map<string, PointStats>();
  rows.filter(r => r.point).forEach(r => {
    if (!map.has(r.point)) {
      map.set(r.point, {
        name: r.point, count: 0, refund: 0,
        byCategory: {}, violations: {}, misdemeanors: {}, cleanCount: 0,
      });
    }
    const s = map.get(r.point)!;
    s.count++;
    s.refund += r.refund;
    if (r.resolution === 'Нарушений нет') s.cleanCount++;
    r.categories.forEach(c => { s.byCategory[c] = (s.byCategory[c] || 0) + 1; });
    r.violations.forEach(v => { s.violations[v] = (s.violations[v] || 0) + 1; });
    r.misdemeanors.forEach(m => { s.misdemeanors[m] = (s.misdemeanors[m] || 0) + 1; });
  });
  return [...map.values()].sort((a, b) => b.count - a.count);
}

function dateToSortKey(d: string): string {
  // Normalise DD.MM.YY and DD.MM.YYYY → YYYYMMDD for correct chronological sort
  const parts = d.split('.');
  if (parts.length !== 3) return d;
  const [dd, mm, yy] = parts;
  const year = yy.length === 2 ? `20${yy}` : yy;
  return `${year}${mm.padStart(2, '0')}${dd.padStart(2, '0')}`;
}

export function byDate(rows: SheetRow[]): { date: string; count: number }[] {
  // Normalise inconsistent date formats (e.g. "06.06.2026" vs "06.06.26") before grouping
  const counts: Record<string, number> = {};
  rows.forEach(r => {
    if (!r.date) return;
    const parts = r.date.split('.');
    const key = parts.length === 3
      ? `${parts[0].padStart(2, '0')}.${parts[1].padStart(2, '0')}`
      : r.date;
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts)
    .sort(([a], [b]) => dateToSortKey(a).localeCompare(dateToSortKey(b)))
    .map(([date, count]) => ({ date, count }));
}

export function sumRefund(rows: SheetRow[]): number {
  return rows.reduce((sum, r) => sum + r.refund, 0);
}

export function uniqueValues(rows: SheetRow[], key: keyof Pick<SheetRow, 'point' | 'position' | 'object'>): string[] {
  return [...new Set(rows.map(r => r[key] as string).filter(Boolean))].sort();
}

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
