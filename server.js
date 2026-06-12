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
  const firstLine = cache.csv.split('\n')[0];
  const headers = firstLine.split(',').map((h, i) => ({ i, header: h.replace(/\n/g, ' ').trim() }));
  res.json(headers);
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
