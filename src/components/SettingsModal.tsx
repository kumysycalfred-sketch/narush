import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { fetchSettings, updateSettings } from '../api/settings';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function formatSavedAt(savedAt: string | null): string {
  if (!savedAt) return 'ещё не менялась';
  return new Date(savedAt).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function SettingsModal({ open, onClose, onSaved }: Props) {
  const [url, setUrl]           = useState('');
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [savedAt, setSavedAt]   = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSuccess(false);
    setLoading(true);
    fetchSettings()
      .then(s => { setCurrentUrl(s.sheetUrl); setSavedAt(s.savedAt); setUrl(''); })
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleSave = async () => {
    if (!url.trim()) { setError('Вставьте ссылку на таблицу'); return; }
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await updateSettings(url);
      setCurrentUrl(result.sheetUrl);
      setSavedAt(result.savedAt);
      setUrl('');
      setSuccess(true);
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="settings-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            className="relative z-10 w-full max-w-lg rounded-xl"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 py-4 flex items-start justify-between gap-4 rounded-t-xl" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h2 className="text-primary font-bold text-lg leading-tight">Источник данных</h2>
                <p className="text-secondary text-sm mt-0.5">Смена таблицы на новый месяц</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-border transition-colors text-secondary hover:text-primary shrink-0"
                aria-label="Закрыть"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <p className="text-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">Текущая таблица</p>
                {loading ? (
                  <div className="h-4 w-2/3 rounded bg-border animate-pulse" />
                ) : (
                  <>
                    <p className="text-primary text-xs font-mono break-all">{currentUrl}</p>
                    <p className="text-secondary text-xs mt-1">Обновлена: {formatSavedAt(savedAt)}</p>
                  </>
                )}
              </div>

              <div>
                <label htmlFor="sheet-url-input" className="text-secondary text-xs font-semibold uppercase tracking-wider mb-1.5 block">
                  Новая ссылка на Google Таблицу
                </label>
                <input
                  id="sheet-url-input"
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
                  placeholder="https://docs.google.com/spreadsheets/d/…/edit?gid=…"
                  className="w-full px-3 py-2 rounded-lg bg-card border border-border text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  disabled={saving}
                />
                <p className="text-secondary text-xs mt-1.5">
                  Вставьте обычную ссылку на лист (Поделиться → Копировать ссылку). Лист должен быть открыт «для всех, у кого есть ссылка».
                </p>
              </div>

              {error && (
                <div className="bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
                  <p className="text-danger text-sm">{error}</p>
                </div>
              )}

              {success && !error && (
                <div className="bg-success/10 border border-success/30 rounded-lg px-3 py-2">
                  <p className="text-success text-sm">Готово — данные подхвачены из новой таблицы.</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-secondary hover:text-primary transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors active:scale-95 disabled:opacity-40"
                >
                  {saving ? 'Сохранение…' : 'Сохранить и обновить'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
