export interface SheetSource {
  id: string;
  sheetUrl: string;
  savedAt: string | null;
  rowCount: number;
  active: boolean;
}

export interface SheetSettings {
  sheetUrl: string;
  savedAt: string | null;
  sources: SheetSource[];
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

export async function deleteSource(id: string): Promise<void> {
  const res = await fetch(`/api/settings/sources/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? 'Не удалось удалить источник');
  }
}
