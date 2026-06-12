export interface SheetResponse {
  csv: string;
  updatedAt: string | null;
}

export async function fetchSheet(): Promise<SheetResponse> {
  const res = await fetch('/api/sheet');
  if (!res.ok) throw new Error(`HTTP ${res.status}: не удалось загрузить данные`);
  const csv = await res.text();
  const updatedAt = res.headers.get('X-Updated-At');
  return { csv, updatedAt };
}
