const express = require('express');
const path = require('path');
const fs = require('fs');
const Papa = require('papaparse');

const app = express();
const PORT = process.env.PORT || 3000;
const DEFAULT_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1acOsDrO3b09INmF2oRLLRIJLlIqRCLrh_hLxnswxy0Q/export?format=csv&gid=233513778';
const REFRESH_MS = 5 * 60 * 1000;
const SETTINGS_PATH = path.join(__dirname, 'data', 'settings.json');

let cache = { csv: null, updatedAt: null };

function loadSettings() {
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.sheetUrl === 'string') return parsed;
  } catch {
    // no saved settings yet — fall back to default
  }
  return { sheetUrl: DEFAULT_SHEET_URL, savedAt: null };
}

function saveSettings(next) {
  fs.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true });
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(next, null, 2));
}

// Принимает как ссылку на редактирование ("...spreadsheets/d/ID/edit?gid=X"),
// так и уже готовую export-ссылку, и приводит её к каноническому CSV-экспорту.
// Хост жёстко ограничен docs.google.com, чтобы сервер не превращался в открытый SSRF-прокси.
function parseSheetUrl(input) {
  const trimmed = (input || '').trim();
  if (!trimmed) throw new Error('Ссылка не может быть пустой');

  let url;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error('Некорректная ссылка');
  }

  if (url.hostname !== 'docs.google.com') {
    throw new Error('Ожидается ссылка на Google Таблицы (docs.google.com)');
  }

  const match = url.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    throw new Error('Не удалось найти ID таблицы в ссылке');
  }
  const sheetId = match[1];

  const gidFromHash = (url.hash.match(/gid=(\d+)/) || [])[1];
  const gid = url.searchParams.get('gid') || gidFromHash || '0';

  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

let settings = loadSettings();

async function refreshCache() {
  try {
    const res = await fetch(settings.sheetUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csv = await res.text();
    cache = { csv, updatedAt: new Date().toISOString() };
    console.log('[cache] refreshed at', cache.updatedAt);
  } catch (err) {
    console.error('[cache] fetch failed:', err.message);
  }
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

app.get('/api/debug/headers', (req, res) => {
  if (!cache.csv) return res.status(503).json({ error: 'Cache not ready' });
  const parsed = Papa.parse(cache.csv, { skipEmptyLines: true });
  const headers = (parsed.data[0] || []).map((h, i) => ({
    i,
    header: String(h).replace(/\n/g, ' ').trim(),
  }));
  res.json(headers);
});

app.get('/api/debug/department', (req, res) => {
  if (!cache.csv) return res.status(503).json({ error: 'Cache not ready' });
  const lines = cache.csv.split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/\n/g, ' ').trim().toLowerCase());
  const iDept = headers.findIndex(h => h.includes('отдел'));
  if (iDept < 0) return res.json({ error: 'Колонка отдел не найдена', headers });
  const values = [...new Set(
    lines.slice(1).map(l => (l.split(',')[iDept] || '').trim()).filter(Boolean)
  )];
  res.json({ columnIndex: iDept, uniqueValues: values });
});

app.get('/api/debug/dates', (req, res) => {
  if (!cache.csv) return res.status(503).json({ error: 'Cache not ready' });
  const parsed = Papa.parse(cache.csv, { skipEmptyLines: true });
  const rows = parsed.data;
  const iDate = 1; // "дата нарушения"
  const counts = {};
  rows.slice(1).forEach(row => {
    const d = (row[iDate] || '').trim() || '(пусто)';
    counts[d] = (counts[d] || 0) + 1;
  });
  const total = rows.length - 1;
  res.json({ total, byDate: counts });
});

app.get('/api/refresh', async (req, res) => {
  await refreshCache();
  res.json({ ok: true, updatedAt: cache.updatedAt });
});

app.get('/api/settings', (req, res) => {
  res.json({ sheetUrl: settings.sheetUrl, savedAt: settings.savedAt });
});

app.post('/api/settings', async (req, res) => {
  let sheetUrl;
  try {
    sheetUrl = parseSheetUrl(req.body && req.body.url);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  let csv;
  try {
    const testRes = await fetch(sheetUrl);
    if (!testRes.ok) throw new Error(`HTTP ${testRes.status}`);
    csv = await testRes.text();
    if (!csv || !csv.trim()) throw new Error('Таблица пуста или недоступна');
  } catch (err) {
    return res.status(400).json({ error: `Не удалось загрузить таблицу: ${err.message}` });
  }

  settings = { sheetUrl, savedAt: new Date().toISOString() };
  saveSettings(settings);
  cache = { csv, updatedAt: settings.savedAt };

  res.json({ ok: true, sheetUrl: settings.sheetUrl, savedAt: settings.savedAt });
});

app.get('/api/sheet', (req, res) => {
  if (!cache.csv) {
    return res.status(503).json({ error: 'Data not ready, try again in a few seconds' });
  }
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('X-Updated-At', cache.updatedAt ?? '');
  res.setHeader('Cache-Control', 'no-cache');
  res.send(cache.csv);
});

app.get('*', (_req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(indexPath, err => {
    if (err) res.status(503).send('Build not found. Run npm run build first.');
  });
});

if (require.main === module) {
  refreshCache();
  setInterval(refreshCache, REFRESH_MS);
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = { app, parseSheetUrl };