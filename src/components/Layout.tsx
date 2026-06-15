import { ReactNode } from 'react';
import { Tab, DateRange } from '../types';
import DateRangeFilter from './DateRangeFilter';

const TABS: { key: Tab; label: string; short: string }[] = [
  { key: 'overview',    label: 'Обзор',       short: 'Обзор' },
  { key: 'staff',       label: 'Сотрудники',  short: 'Люди' },
  { key: 'points',      label: 'Точки',       short: 'Точки' },
  { key: 'departments', label: 'Отделы',      short: 'Отделы' },
];

interface LayoutProps {
  tab: Tab;
  setTab: (t: Tab) => void;
  dark: boolean;
  toggleTheme: () => void;
  updatedAt: string | null;
  onRefresh: () => void;
  refreshing: boolean;
  dateRange: DateRange;
  onDateChange: (r: DateRange) => void;
  children: ReactNode;
}

export default function Layout({
  tab, setTab, dark, toggleTheme,
  updatedAt, onRefresh, refreshing,
  dateRange, onDateChange, children,
}: LayoutProps) {
  const timeLabel = updatedAt
    ? new Date(updatedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="min-h-screen bg-base transition-colors duration-300">
      <header
        className="sticky top-0 z-20 border-b transition-colors duration-300"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        {/* ── Top bar ── */}
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex items-center justify-between h-14">

            {/* Logo mark */}
            <button
              onClick={() => setTab('overview')}
              className="flex items-center gap-3 group"
              aria-label="На главную"
            >
              <div
                className="w-7 h-7 rounded flex items-center justify-center shrink-0 transition-opacity duration-200 group-hover:opacity-80"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <span className="font-display font-700 text-xs leading-none"
                  style={{ color: dark ? '#0F1115' : '#fff', fontWeight: 700 }}>
                  КК
                </span>
              </div>
              <span
                className="font-display font-semibold text-sm tracking-tight hidden sm:block"
                style={{ color: 'var(--text-primary)' }}
              >
                Контроль качества
              </span>
            </button>

            {/* Right controls */}
            <div className="flex items-center gap-1">
              {/* Live dot + timestamp */}
              {timeLabel && (
                <div className="hidden sm:flex items-center gap-2 mr-3">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: 'var(--accent)',
                      animation: 'pulse-dot 2s ease-in-out infinite',
                    }}
                  />
                  <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {timeLabel}
                  </span>
                </div>
              )}

              <button
                onClick={onRefresh}
                disabled={refreshing}
                className="h-8 px-3 rounded text-xs font-medium transition-all duration-150 active:scale-95 disabled:opacity-40 flex items-center gap-1.5"
                style={{
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                }}
                aria-label="Обновить данные"
              >
                <span
                  className="inline-block text-sm"
                  style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}
                >
                  ↺
                </span>
                <span className="hidden sm:inline">Обновить</span>
              </button>

              <button
                onClick={toggleTheme}
                className="h-8 w-8 rounded flex items-center justify-center text-sm transition-all duration-150 active:scale-95 ml-1"
                style={{
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-color)',
                }}
                aria-label="Переключить тему"
              >
                {dark ? '○' : '●'}
              </button>
            </div>
          </div>

          {/* ── Tab navigation ── */}
          <nav className="flex gap-0 -mb-px">
            {TABS.map(({ key, label, short }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className="relative px-4 py-3 text-sm font-medium transition-colors duration-150 shrink-0"
                  style={{
                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                    background: 'transparent',
                  }}
                >
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{short}</span>
                  {active && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-[2px]"
                      style={{ backgroundColor: 'var(--accent)' }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Date filter bar ── */}
        <div style={{ borderTop: '1px solid var(--border-color)' }}>
          <DateRangeFilter value={dateRange} onChange={onDateChange} />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 py-6">
        {children}
      </main>
    </div>
  );
}
