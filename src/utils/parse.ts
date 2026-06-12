import Papa from 'papaparse';
import { SheetRow } from '../types';

export function parseRefund(raw: string): number {
  if (!raw?.trim()) return 0;
  const clean = raw.replace(/р\./g, '').replace(/\s/g, '').replace(',', '.').trim();
  return parseFloat(clean) || 0;
}

export function parseList(raw: string): string[] {
  if (!raw?.trim()) return [];
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

export function parseMeta3p(raw: string): string {
  if (!raw?.trim()) return '';
  const v = raw.trim().toLowerCase();
  if (v.includes('прощение')) return 'Прощение';
  if (v.includes('премии') || v.includes('ремия') || v.includes('семит')) return 'Лишение премии';
  return raw.trim();
}

export function isGuestReview(type: string): boolean {
  return type?.startsWith('Отзыв гостя') ?? false;
}

export function isViolation(resolution: string): boolean {
  return resolution?.trim() !== 'Нарушений нет';
}

export function parseRows(csv: string): SheetRow[] {
  const result = Papa.parse<string[]>(csv, { skipEmptyLines: true });
  const rows = result.data;
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.replace(/\n/g, ' ').trim().toLowerCase());
  const idx = (term: string) => headers.findIndex(h => h.includes(term));

  const iDate        = headers.findIndex(h => h.includes('дата') && h.includes('нарушения'));
  const iPoint       = idx('точка');
  const iType        = headers.findIndex(h => h === 'вид');
  const iSource      = idx('источник');
  const iShift       = idx('день');
  const iObject      = headers.findIndex(h => h === 'объект');
  const iCategories  = idx('категории');
  const iViolations  = idx('грубые');
  const iMisdemean   = idx('проступки');
  const iName        = idx('фио');
  const iPosition    = idx('должность');
  const iDepartment  = idx('отдел');
  const iMeta3p      = headers.findIndex(h => h.includes('3') && h.includes('п'));
  const iLink        = headers.findIndex(h => h === 'ссылка');
  const iRefund      = idx('сумма возврата');
  const iResolution  = idx('решение');

  const get = (row: string[], i: number) => (i >= 0 ? row[i]?.trim() || '' : '');

  return rows.slice(1)
    .map(row => ({
      date:         get(row, iDate),
      point:        get(row, iPoint),
      type:         get(row, iType),
      source:       get(row, iSource),
      shift:        get(row, iShift),
      object:       get(row, iObject),
      categories:   parseList(get(row, iCategories)),
      violations:   parseList(get(row, iViolations)),
      misdemeanors: parseList(get(row, iMisdemean)),
      name:         get(row, iName),
      position:     get(row, iPosition),
      department:   get(row, iDepartment),
      meta3p:       parseMeta3p(get(row, iMeta3p)),
      link:         get(row, iLink),
      // Администраторы не учитываются в сумме возврата
      refund:       get(row, iDepartment).toLowerCase() === 'администратор' ? 0 : parseRefund(get(row, iRefund)),
      resolution:   get(row, iResolution),
    }))
    .filter(r => r.date || r.point);
}
