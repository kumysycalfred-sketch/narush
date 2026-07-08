import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { fetchSettings, updateSettings, deleteSource, SheetSource } from '../api/settings';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function formatDate(value: string | null): string {
  if (!value) return 'ещё не менялась';
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  );
}

function SourceRow({ source, onDelete, deleting }: { source: SheetSource; onDelete: (id: string) => void; deleting: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 px-3 rounded-lg bg-card border border-border">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {source.active && (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/10 text-accent shrink-0">
              активен
            </span>
          )}
          <p className="text-primary text-xs font-mono truncate">{source.sheetUrl}</p>
        </div>
        <p className="text-secondary text-xs mt-1">
          {source.rowCount.toLocaleString('ru-RU')} записей · добавлен {formatDate(source.savedAt)}
        </p>
      </div>
      {!source.active && (
        <button
          onClick={() => onDelete(source.id)}
          disabled={deleting}
          className="p-1.5 rounded-lg hover:bg-danger/10 transition-colors text-secondary hover:text-danger shrink-0 disabled:opacity-40"
          aria-label="Удалить источник"
        >
          <TrashIcon />
        </button>
      )}
    </div>
  );
}

export default function SettingsModal({ open, onClose, onSaved }: Props) {
  const [url, setUrl]           = useState('');
  const [sources, setSources]   = useState<SheetSource[]>([]);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);

  const load = () => {
    setLoading(true);
    return fetchSettings()
      .then(s => setSources(s.sources))
      .catch(e => setError((e as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSuccess(false);
    setUrl('');
    load();
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
      await updateSettings(url);
      setUrl('');
      setSuccess(true);
      await load();
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      await deleteSource(id);
      await load();
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeletingId(null);
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
            className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="sticky top-0 px-5 py-4 flex items-start justify-between gap-4 rounded-t-xl z-10" style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h2 className="text-primary font-bold text-lg leading-tight">Источники данных</h2>
                <p className="text-secondary text-sm mt-0.5">Каждый месяц — новый лист. Старые данные не пропадают.</p>
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
                <p className="text-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">Подключено ({sources.length})</p>
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-12 rounded-lg bg-border animate-pulse" />
                    <div className="h-12 rounded-lg bg-border animate-pulse" />
                  </div>
                ) : sources.length === 0 ? (
                  <p className="text-secondary text-sm">Источников пока нет.</p>
                ) : (
                  <div className="space-y-1.5">
                    {sources.map(s => (
                      <SourceRow key={s.id} source={s} onDelete={handleDelete} deleting={deletingId === s.id} />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="sheet-url-input" className="text-secondary text-xs font-semibold uppercase tracking-wider mb-1.5 block">
                  Добавить ссылку на новый лист
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
                  Вставьте ссылку на лист (Поделиться → Копировать ссылку), открытый «для всех, у кого есть ссылка».
                  Данные добавятся к уже накопленным, ничего не заменяя.
                </p>
              </div>

              {error && (
                <div className="bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
                  <p className="text-danger text-sm">{error}</p>
                </div>
              )}

              {success && !error && (
                <div className="bg-success/10 border border-success/30 rounded-lg px-3 py-2">
                  <p className="text-success text-sm">Готово — новый лист подключён, данные объединены.</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-secondary hover:text-primary transition-colors"
                >
                  Закрыть
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors active:scale-95 disabled:opacity-40"
                >
                  {saving ? 'Добавление…' : 'Добавить и обновить'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
