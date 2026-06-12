import { describe, it, expect } from 'vitest';
import { parseRefund, parseList, parseMeta3p, isGuestReview, isViolation } from '../utils/parse';

describe('parseRefund', () => {
  it('parses "р.640,00"', () => expect(parseRefund('р.640,00')).toBe(640));
  it('parses "р.1 200,00" with space', () => expect(parseRefund('р.1 200,00')).toBe(1200));
  it('returns 0 for empty string', () => expect(parseRefund('')).toBe(0));
  it('returns 0 for undefined', () => expect(parseRefund(undefined as unknown as string)).toBe(0));
});

describe('parseList', () => {
  it('splits comma-separated values', () => expect(parseList('ТТК, Сервис')).toEqual(['ТТК', 'Сервис']));
  it('trims whitespace', () => expect(parseList(' ТТК , Сервис ')).toEqual(['ТТК', 'Сервис']));
  it('returns [] for empty string', () => expect(parseList('')).toEqual([]));
  it('filters out empty entries from bare comma', () => expect(parseList(',')).toEqual([]));
});

describe('parseMeta3p', () => {
  it('п - прощение → Прощение', () => expect(parseMeta3p('п - прощение')).toBe('Прощение'));
  it('п - ол премии → Лишение премии', () => expect(parseMeta3p('п - ол премии')).toBe('Лишение премии'));
  it('п - ремия → Лишение премии', () => expect(parseMeta3p('п - ремия')).toBe('Лишение премии'));
  it('empty → empty string', () => expect(parseMeta3p('')).toBe(''));
  it('case-insensitive match', () => expect(parseMeta3p('П - Прощение')).toBe('Прощение'));
});

describe('isGuestReview', () => {
  it('"Отзыв гостя" → true', () => expect(isGuestReview('Отзыв гостя')).toBe(true));
  it('"Отзыв гостя, командная ошибка" → true', () =>
    expect(isGuestReview('Отзыв гостя, командная ошибка')).toBe(true));
  it('"доп нарушение" → false', () => expect(isGuestReview('доп нарушение')).toBe(false));
  it('empty → false', () => expect(isGuestReview('')).toBe(false));
});

describe('isViolation', () => {
  it('"Нарушений нет" → false', () => expect(isViolation('Нарушений нет')).toBe(false));
  it('"Возврат" → true', () => expect(isViolation('Возврат')).toBe(true));
  it('"Комплимент" → true', () => expect(isViolation('Комплимент')).toBe(true));
  it('empty string → true', () => expect(isViolation('')).toBe(true));
});
