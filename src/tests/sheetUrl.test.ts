import { describe, it, expect } from 'vitest';
// server.js — CommonJS; importing it only defines routes/exports, it never calls app.listen()
// unless run directly (guarded by `require.main === module`), so this is safe in tests.
import { parseSheetUrl } from '../../server.js';

describe('parseSheetUrl', () => {
  it('converts a normal edit link with gid in query to a canonical export CSV link', () => {
    expect(
      parseSheetUrl('https://docs.google.com/spreadsheets/d/ABC123/edit?gid=456#gid=456')
    ).toBe('https://docs.google.com/spreadsheets/d/ABC123/export?format=csv&gid=456');
  });

  it('reads gid from the hash when absent from the query string', () => {
    expect(
      parseSheetUrl('https://docs.google.com/spreadsheets/d/ABC123/edit#gid=789')
    ).toBe('https://docs.google.com/spreadsheets/d/ABC123/export?format=csv&gid=789');
  });

  it('defaults gid to 0 when missing entirely', () => {
    expect(
      parseSheetUrl('https://docs.google.com/spreadsheets/d/ABC123/edit')
    ).toBe('https://docs.google.com/spreadsheets/d/ABC123/export?format=csv&gid=0');
  });

  it('passes through an already-canonical export link unchanged', () => {
    const url = 'https://docs.google.com/spreadsheets/d/ABC123/export?format=csv&gid=456';
    expect(parseSheetUrl(url)).toBe(url);
  });

  it('trims surrounding whitespace', () => {
    expect(
      parseSheetUrl('  https://docs.google.com/spreadsheets/d/ABC123/edit?gid=1  ')
    ).toBe('https://docs.google.com/spreadsheets/d/ABC123/export?format=csv&gid=1');
  });

  it('rejects an empty string', () => {
    expect(() => parseSheetUrl('')).toThrow('Ссылка не может быть пустой');
  });

  it('rejects a malformed URL', () => {
    expect(() => parseSheetUrl('not a url')).toThrow('Некорректная ссылка');
  });

  it('rejects a non-Google host to prevent open SSRF-style redirection', () => {
    expect(() =>
      parseSheetUrl('https://evil.example.com/spreadsheets/d/ABC123/edit')
    ).toThrow('docs.google.com');
  });

  it('rejects a Google Docs URL that has no spreadsheet ID', () => {
    expect(() => parseSheetUrl('https://docs.google.com/document/d/ABC123/edit')).toThrow(
      'Не удалось найти ID таблицы'
    );
  });
});
