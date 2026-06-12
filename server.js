const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1acOsDrO3b09INmF2oRLLRIJLlIqRCLrh_hLxnswxy0Q/export?format=csv&gid=233513778';
const REFRESH_MS = 5 * 60 * 1000;

let cache = { csv: null, updatedAt: null };

async function refreshCache() {
  try {
    const res = await fetch(SHEET_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csv = await res.text();
    cache = { csv, updatedAt: new Date().toISOString() };
    console.log('[cache] refreshed at', cache.updatedAt);
  } catch (err) {
    console.error('[cache] fetch failed:', err.message);
  }
}

refreshCache();
setInterval(refreshCache, REFRESH_MS);

app.use(express.static(path.join(__dirname, 'dist')));

app.get('/api/debug/headers', (req, res) => {
  if (!cache.csv) return res.status(503).json({ error: 'Cache not ready' });
  // Use a proper CSV-aware parse for the first row to handle quoted fields
  const firstLine = cache.csv.split('\n')[0];
  const headers = [];
  let i = 0, col = 0, cur = '';
  while (i < firstLine.length) {
    if (firstLine[i] === '"') {
      i++;
      while (i < firstLine.length && firstLine[i] !== '"') cur += firstLine[i++];
      i++; // closing quote
    } else if (firstLine[i] === ',') {
      headers.push({ i: col++, header: cur.replace(/\n/g, ' ').trim() });
      cur = ''; i++;
    } else {
      cur += firstLine[i++];
    }
  }
  headers.push({ i: col, header: cur.replace(/\n/g, ' ').trim() });
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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
