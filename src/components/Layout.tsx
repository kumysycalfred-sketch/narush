import { ReactNode } from 'react';
import { Tab, DateRange } from '../types';
import DateRangeFilter from './DateRangeFilter';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Обзор' },
  { key: 'staff',    label: 'Сотрудники' },
  { key: 'points',   label: 'Точки' },
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

export default function Layout({ tab, setTab, dark, toggleTheme, updatedAt, onRefresh, refreshing, dateRange, onDateChange, children }: LayoutProps) {
  const timeLabel = updatedAt
    ? new Date(updatedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="min-h-screen bg-base transition-colors duration-300">
      <header
        className="sticky top-0 z-20 backdrop-blur-xl border-b transition-colors duration-300"
        style={{
          backgroundColor: dark ? 'rgba(10, 14, 26, 0.75)' : 'rgba(255, 255, 255, 0.85)',
          borderBottomColor: dark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(226, 232, 240, 1)',
          boxShadow: dark
            ? '0 1px 0 rgba(99, 102, 241, 0.12), 0 4px 24px rgba(0,0,0,0.3)'
            : '0 1px 0 rgba(0,0,0,0.06)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="w-2 h-6 rounded-full"
              style={{ background: 'linear-gradient(180deg, #6366F1, #A78BFA)' }}
            />
            <button
              onClick={() => setTab('overview')}
              className="flex flex-col items-start leading-none group cursor-pointer"
              aria-label="На главную"
            >
              <span className="font-mono text-[10px] tracking-widest uppercase select-none transition-opacity duration-200"
                style={{ color: dark ? 'rgba(167,139,250,0.55)' : 'rgba(99,102,241,0.5)', letterSpacing: '0.18em' }}>
                by LNFRG
              </span>
              <h1 className="text-primary font-semibold text-lg tracking-tight mt-0.5 group-hover:text-accent transition-colors duration-200">
                Контроль качества
              </h1>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {timeLabel && (
              <span className="text-secondary text-xs font-mono hidden sm:block opacity-70">
                обновлено {timeLabel}
              </span>
            )}
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg transition-all duration-200 active:scale-95 text-base disabled:opacity-50"
              style={{
                background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                color: 'var(--text-secondary)',
              }}
              aria-label="Обновить данные"
            >
              <span
                className="inline-block transition-transform"
                style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}
              >
                🔄
              </span>
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-all duration-200 active:scale-95 text-base"
              style={{
                background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                color: 'var(--text-secondary)',
              }}
              aria-label="Переключить тему"
            >
              {dark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        <nav className="max-w-7xl mx-auto px-4 flex gap-1 pb-2">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={tab === key ? {
                background: dark
                  ? 'linear-gradient(135deg, rgba(99,102,241,0.35), rgba(167,139,250,0.2))'
                  : '#6366F1',
                color: '#FFFFFF',
                boxShadow: dark ? '0 0 16px rgba(99,102,241,0.3)' : 'none',
              } : {
                color: 'var(--text-secondary)',
                background: 'transparent',
              }}
              onMouseEnter={e => {
                if (tab !== key) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={e => {
                if (tab !== key) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                }
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        <DateRangeFilter value={dateRange} onChange={onDateChange} />
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
