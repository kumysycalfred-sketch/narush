import { describe, it, expect } from 'vitest';
// server.js — CommonJS; importing it only defines routes/exports, it never calls app.listen()
// unless run directly (guarded by `require.main === module`), so this is safe in tests.
import { parseSheetUrl, mergeCsvList } from '../../server.js';

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

describe('mergeCsvList', () => {
  it('returns an empty string for an empty list', () => {
    expect(mergeCsvList([])).toBe('');
  });

  it('returns an empty string when every entry is null/empty', () => {
    expect(mergeCsvList([null, undefined, ''])).toBe('');
  });

  it('passes a single CSV through with its header and rows intact', () => {
    const csv = 'name,count\r\nAlice,1\r\nBob,2';
    expect(mergeCsvList([csv])).toBe('name,count\r\nAlice,1\r\nBob,2');
  });

  it('concatenates data rows from multiple months under one shared header', () => {
    const june = 'name,count\nAlice,1\nBob,2';
    const july = 'name,count\nCarol,3';
    expect(mergeCsvList([june, july])).toBe('name,count\r\nAlice,1\r\nBob,2\r\nCarol,3');
  });

  it('skips null/empty entries mixed in with real sources', () => {
    const june = 'name,count\nAlice,1';
    const july = 'name,count\nCarol,3';
    expect(mergeCsvList([june, null, july, ''])).toBe('name,count\r\nAlice,1\r\nCarol,3');
  });

  it('drops a source that has only a header and no data rows', () => {
    const june = 'name,count\nAlice,1';
    const emptyJuly = 'name,count';
    expect(mergeCsvList([june, emptyJuly])).toBe('name,count\r\nAlice,1');
  });

  it('keeps the first non-empty header even if later sources reorder columns differently', () => {
    const june = 'name,count\nAlice,1';
    const july = 'count,name\n2,Bob';
    // header comes from june; july's row is appended as-is (values follow june's column order positionally)
    expect(mergeCsvList([june, july])).toBe('name,count\r\nAlice,1\r\n2,Bob');
  });
});
