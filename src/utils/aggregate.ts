import { SheetRow, EmployeeStats, PointStats, ProcessorStats, DateRange } from '../types';

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
  const parts = d.split('.');
  // БАГ 5: "DD.MM" (2 части) — сортируем как MMDD чтобы не ломать порядок при переходе месяца
  if (parts.length === 2) {
    const [dd, mm] = parts;
    return `${mm.padStart(2, '0')}${dd.padStart(2, '0')}`;
  }
  if (parts.length !== 3) return d;
  const [dd, mm, yy] = parts;
  const year = yy.length === 2 ? `20${yy}` : yy;
  return `${year}${mm.padStart(2, '0')}${dd.padStart(2, '0')}`;
}

// Нормализует дату к формату "DD.MM" (с нулями), используется для фильтрации dayRecords
export function normShortDate(d: string): string {
  const parts = d.split('.');
  if (parts.length < 2) return d;
  return `${parts[0].padStart(2, '0')}.${parts[1].padStart(2, '0')}`;
}

export function byDate(rows: SheetRow[]): { date: string; count: number }[] {
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

export function byProcessedDate(rows: SheetRow[]): { date: string; count: number }[] {
  const counts: Record<string, number> = {};
  rows.forEach(r => {
    if (!r.processedAt) return;
    const parts = r.processedAt.split('.');
    const key = parts.length >= 3
      ? `${parts[0].padStart(2, '0')}.${parts[1].padStart(2, '0')}`
      : r.processedAt;
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts)
    .sort(([a], [b]) => dateToSortKey(a).localeCompare(dateToSortKey(b)))
    .map(([date, count]) => ({ date, count }));
}

export function sumRefund(rows: SheetRow[]): number {
  return rows.reduce((sum, r) => sum + r.refund, 0);
}

export function isBonus(row: SheetRow): boolean {
  return row.statusOS.toLowerCase().includes('начислены баллы');
}

export function sumCashRefund(rows: SheetRow[]): number {
  return rows.filter(r => !isBonus(r)).reduce((sum, r) => sum + r.refund, 0);
}

export function sumBonusRefund(rows: SheetRow[]): number {
  return rows.filter(r => isBonus(r)).reduce((sum, r) => sum + r.refund, 0);
}

export function uniqueValues(rows: SheetRow[], key: keyof Pick<SheetRow, 'point' | 'position' | 'object'>): string[] {
  return [...new Set(rows.map(r => r[key] as string).filter(Boolean))].sort();
}

function parseSheetDate(d: string): Date | null {
  if (!d || !d.trim()) return null;
  const parts = d.split('.');
  if (parts.length < 3) return null;
  const [dd, mm, yy] = parts;
  const year = yy.length === 2 ? 2000 + parseInt(yy, 10) : parseInt(yy, 10);
  const date = new Date(year, parseInt(mm, 10) - 1, parseInt(dd, 10));
  return isNaN(date.getTime()) ? null : date;
}

export function buildProcessorStats(rows: SheetRow[]): ProcessorStats[] {
  const countMap = new Map<string, { deptCounts: Record<string, number>; count: number }>();
  rows.filter(r => r.processor).forEach(r => {
    if (!countMap.has(r.processor)) {
      countMap.set(r.processor, { deptCounts: {}, count: 0 });
    }
    const entry = countMap.get(r.processor)!;
    entry.count++;
    // БАГ 6: накапливаем счётчик по отделам, берём наиболее частый
    if (r.department) entry.deptCounts[r.department] = (entry.deptCounts[r.department] || 0) + 1;
  });
  return [...countMap.entries()]
    .map(([name, { deptCounts, count }]) => {
      const department = Object.entries(deptCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? '';
      return { name, department, count };
    })
    .sort((a, b) => b.count - a.count);
}

export function filterByDate(rows: SheetRow[], range: DateRange): SheetRow[] {
  if (!range.from && !range.to) return rows;
  return rows.filter(r => {
    const d = parseSheetDate(r.date);
    // БАГ 3: строки без парсируемой даты исключаем при активном фильтре
    if (!d) return false;
    if (range.from && d < range.from) return false;
    if (range.to && d > range.to) return false;
    return true;
  });
}

export function filterByProcessedAt(rows: SheetRow[], range: DateRange): SheetRow[] {
  if (!range.from && !range.to) return rows;
  return rows.filter(r => {
    const d = parseSheetDate(r.processedAt);
    // БАГ 3: строки без парсируемой даты исключаем при активном фильтре
    if (!d) return false;
    if (range.from && d < range.from) return false;
    if (range.to && d > range.to) return false;
    return true;
  });
}

// Возвращает предыдущий период той же длины, непосредственно перед текущим.
export function getPrevRange(range: DateRange): DateRange {
  if (!range.from || !range.to) return { from: null, to: null };
  const durationMs = range.to.getTime() - range.from.getTime() + 86400000;
  const prevTo   = new Date(range.from.getTime() - 86400000);
  const prevFrom = new Date(prevTo.getTime() - durationMs + 86400000);
  return { from: prevFrom, to: prevTo };
}

// Тепловая карта нарушений по сменам: топ-15 точек × день/ночь.
export function buildShiftHeatmap(rows: SheetRow[]): { point: string; day: number; night: number }[] {
  const map = new Map<string, { day: number; night: number }>();
  rows.filter(r => r.point).forEach(r => {
    if (!map.has(r.point)) map.set(r.point, { day: 0, night: 0 });
    const s = map.get(r.point)!;
    if (r.shift.toLowerCase().includes('ноч')) s.night++;
    else s.day++;
  });
  return [...map.entries()]
    .map(([point, v]) => ({ point, ...v }))
    .sort((a, b) => (b.day + b.night) - (a.day + a.night))
    .slice(0, 15);
}