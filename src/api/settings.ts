export interface SheetSettings {
  sheetUrl: string;
  savedAt: string | null;
}

export async function fetchSettings(): Promise<SheetSettings> {
  const res = await fetch('/api/settings');
  if (!res.ok) throw new Error('Не удалось получить настройки');
  return res.json();
}

export async function updateSettings(url: string): Promise<SheetSettings> {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Не удалось сохранить ссылку');
  return data;
}
