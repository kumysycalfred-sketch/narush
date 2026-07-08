const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Papa = require('papaparse');

const app = express();
const PORT = process.env.PORT || 3000;
const DEFAULT_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1acOsDrO3b09INmF2oRLLRIJLlIqRCLrh_hLxnswxy0Q/export?format=csv&gid=233513778';
const REFRESH_MS = 5 * 60 * 1000;
const SETTINGS_PATH = path.join(__dirname, 'data', 'settings.json');
const SOURCES_INDEX_PATH = path.join(__dirname, 'data', 'sources.json');
const ARCHIVE_DIR = path.join(__dirname, 'data', 'archive');

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

function sourceId(sheetUrl) {
  return crypto.createHash('sha1').update(sheetUrl).digest('hex').slice(0, 12);
}

function loadSourceIndex() {
  try {
    const raw = fs.readFileSync(SOURCES_INDEX_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.entries)) return parsed;
  } catch {
    // no archived sources yet
  }
  return { entries: [] };
}

function saveSourceIndex(index) {
  fs.mkdirSync(path.dirname(SOURCES_INDEX_PATH), { recursive: true });
  fs.writeFileSync(SOURCES_INDEX_PATH, JSON.stringify(index, null, 2));
}

function archiveFilePath(id) {
  return path.join(ARCHIVE_DIR, `${id}.csv`);
}

function countDataRows(csv) {
  const parsed = Papa.parse(csv, { skipEmptyLines: true });
  return Math.max(parsed.data.length - 1, 0);
}

// Каждый месяц — новый лист таблицы. Вместо того чтобы заменять данные при
// смене ссылки, каждый источник архивируется на диск отдельно, а итоговый
// набор строится объединением всех архивов — старые месяцы не пропадают.
async function storeSource(sheetUrl) {
  const res = await fetch(sheetUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const csv = await res.text();
  if (!csv || !csv.trim()) throw new Error('Таблица пуста или недоступна');

  const id = sourceId(sheetUrl);
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  fs.writeFileSync(archiveFilePath(id), csv);

  const index = loadSourceIndex();
  const entry = { id, sheetUrl, savedAt: new Date().toISOString(), rowCount: countDataRows(csv) };
  const existing = index.entries.find(e => e.id === id);
  if (existing) {
    Object.assign(existing, entry);
  } else {
    index.entries.push(entry);
  }
  saveSourceIndex(index);
  return entry;
}

// Объединяет несколько CSV с одинаковым заголовком в один: берёт заголовок
// первого непустого источника и склеивает строки данных из всех остальных.
function mergeCsvList(csvList) {
  let header = null;
  const rows = [];
  for (const csv of csvList) {
    if (!csv) continue;
    const parsed = Papa.parse(csv, { skipEmptyLines: true });
    if (parsed.data.length === 0) continue;
    if (!header) header = parsed.data[0];
    rows.push(...parsed.data.slice(1));
  }
  if (!header) return '';
  return Papa.unparse([header, ...rows]);
}

function mergeArchivedSources() {
  const index = loadSourceIndex();
  const csvList = index.entries.map(entry => {
    try {
      return fs.readFileSync(archiveFilePath(entry.id), 'utf-8');
    } catch {
      return null;
    }
  });
  return mergeCsvList(csvList);
}

let settings = loadSettings();

async function refreshCache() {
  try {
    await storeSource(settings.sheetUrl);
    cache = { csv: mergeArchivedSources(), updatedAt: new Date().toISOString() };
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
  const index = loadSourceIndex();
  res.json({
    sheetUrl: settings.sheetUrl,
    savedAt: settings.savedAt,
    sources: index.entries.map(({ id, sheetUrl, savedAt, rowCount }) => ({
      id,
      sheetUrl,
      savedAt,
      rowCount,
      active: sheetUrl === settings.sheetUrl,
    })),
  });
});

app.post('/api/settings', async (req, res) => {
  let sheetUrl;
  try {
    sheetUrl = parseSheetUrl(req.body && req.body.url);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  try {
    await storeSource(sheetUrl);
  } catch (err) {
    return res.status(400).json({ error: `Не удалось загрузить таблицу: ${err.message}` });
  }

  settings = { sheetUrl, savedAt: new Date().toISOString() };
  saveSettings(settings);
  cache = { csv: mergeArchivedSources(), updatedAt: settings.savedAt };

  res.json({ ok: true, sheetUrl: settings.sheetUrl, savedAt: settings.savedAt });
});

app.delete('/api/settings/sources/:id', (req, res) => {
  const { id } = req.params;
  if (sourceId(settings.sheetUrl) === id) {
    return res.status(400).json({ error: 'Нельзя удалить активный источник — сначала подключите другой' });
  }

  const index = loadSourceIndex();
  const next = index.entries.filter(e => e.id !== id);
  if (next.length === index.entries.length) {
    return res.status(404).json({ error: 'Источник не найден' });
  }
  saveSourceIndex({ entries: next });
  try { fs.unlinkSync(archiveFilePath(id)); } catch {}

  cache = { csv: mergeArchivedSources(), updatedAt: new Date().toISOString() };
  res.json({ ok: true });
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

module.exports = { app, parseSheetUrl, mergeCsvList };
