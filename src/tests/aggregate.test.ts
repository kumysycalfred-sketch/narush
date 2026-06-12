import { describe, it, expect } from 'vitest';
import { countBy, topN, buildEmployeeStats, buildPointStats, byDate, filterByDate } from '../utils/aggregate';
import { SheetRow } from '../types';

const base: SheetRow = {
  date: '01.06', point: 'МЧС', type: 'Отзыв гостя', source: 'Телеграм',
  shift: 'День', object: 'Кухня', categories: ['ТТК'], violations: ['Ошибка в технологии'],
  misdemeanors: [], name: 'Иванов Иван', position: 'Повар',
  meta3p: 'Прощение', refund: 640, resolution: 'Возврат',
};
const row1 = { ...base };
const row2 = { ...base, categories: ['Сервис'], refund: 0, violations: [] };
const row3 = { ...base, point: 'ЦПП', name: 'Петров Пётр', refund: 100, categories: ['ТТК'] };

describe('countBy', () => {
  it('counts occurrences by key', () => {
    expect(countBy([row1, row2, row3], r => r.point)).toEqual({ МЧС: 2, ЦПП: 1 });
  });
  it('skips empty keys', () => {
    expect(countBy([{ ...row1, point: '' }], r => r.point)).toEqual({});
  });
});

describe('topN', () => {
  it('returns top N sorted descending', () => {
    const result = topN({ МЧС: 5, ЦПП: 3, ГВЗ: 1 }, 2);
    expect(result).toEqual([{ name: 'МЧС', count: 5 }, { name: 'ЦПП', count: 3 }]);
  });
  it('returns all when N > size', () => {
    expect(topN({ А: 1 }, 10)).toHaveLength(1);
  });
});

describe('buildEmployeeStats', () => {
  it('aggregates count and refund per employee', () => {
    const stats = buildEmployeeStats([row1, row2]);
    expect(stats).toHaveLength(1);
    expect(stats[0].count).toBe(2);
    expect(stats[0].refund).toBe(640);
  });
  it('splits by category', () => {
    const stats = buildEmployeeStats([row1, row2]);
    expect(stats[0].byCategory).toEqual({ ТТК: 1, Сервис: 1 });
  });
  it('skips rows without name', () => {
    expect(buildEmployeeStats([{ ...row1, name: '' }])).toHaveLength(0);
  });
  it('sorts by count descending', () => {
    const stats = buildEmployeeStats([row3, row1, row2]);
    expect(stats[0].name).toBe('Иванов Иван');
  });
});

describe('buildPointStats', () => {
  it('aggregates per point', () => {
    const stats = buildPointStats([row1, row2, row3]);
    const mcs = stats.find(s => s.name === 'МЧС')!;
    expect(mcs.count).toBe(2);
    expect(mcs.refund).toBe(640);
  });
  it('counts clean resolutions', () => {
    const clean = { ...row1, resolution: 'Нарушений нет' };
    const stats = buildPointStats([clean, row1]);
    expect(stats[0].cleanCount).toBe(1);
  });
});

describe('byDate', () => {
  it('groups and sorts by date', () => {
    const r2 = { ...row1, date: '02.06' };
    expect(byDate([row1, row2, r2])).toEqual([
      { date: '01.06', count: 2 },
      { date: '02.06', count: 1 },
    ]);
  });
});

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

  it('filters with both from and to active', () => {
    const from = new Date(2026, 5, 5, 0, 0, 0);
    const to   = new Date(2026, 5, 10, 23, 59, 59);
    const rows = [r('04.06.2026'), r('05.06.2026'), r('08.06.2026'), r('10.06.2026'), r('11.06.2026')];
    const result = filterByDate(rows, { from, to });
    expect(result.map(x => x.date)).toEqual(['05.06.2026', '08.06.2026', '10.06.2026']);
  });
});
