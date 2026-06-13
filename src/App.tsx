import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SheetRow, Tab, DateRange } from './types';
import { fetchSheet } from './api/fetchSheet';
import { parseRows } from './utils/parse';
import { filterByDate, filterByProcessedAt, getPrevRange } from './utils/aggregate';
import { useTheme } from './hooks/useTheme';
import Layout from './components/Layout';
import { SkeletonPage } from './components/Skeleton';
import Overview from './pages/Overview';
import Staff from './pages/Staff';
import Points from './pages/Points';
import Departments from './pages/Departments';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  enter:   { opacity: 1, y: 0  },
  exit:    { opacity: 0, y: -10 },
};

function ErrorBanner({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="bg-danger/10 border border-danger/30 rounded-xl p-6 text-center space-y-3">
      <p className="text-danger font-medium">Ошибка загрузки данных</p>
      <p className="text-secondary text-sm">{error}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent/90 transition-colors active:scale-95"
      >
        Повторить
      </button>
    </div>
  );
}

export default function App() {
  const { dark, toggle } = useTheme();
  const [tab, setTab]               = useState<Tab>('overview');
  const [rows, setRows]             = useState<SheetRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [updatedAt, setUpdatedAt]   = useState<string | null>(null);
  const [dateRange, setDateRange]   = useState<DateRange>({ from: null, to: null });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { csv, updatedAt: ua } = await fetchSheet();
      setRows(parseRows(csv));
      setUpdatedAt(ua);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try { await fetch('/api/refresh'); } catch {}
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [load]);

  // Обзор / Сотрудники / Точки — фильтр по дате нарушения
  const dateFiltered = useMemo(() => filterByDate(rows, dateRange), [rows, dateRange]);
  // Отделы — фильтр по дате внесения (processedAt)
  const deptFiltered = useMemo(() => filterByProcessedAt(rows, dateRange), [rows, dateRange]);
  // Предыдущий период для сравнения на вкладке Обзор
  const prevRange    = useMemo(() => getPrevRange(dateRange), [dateRange]);
  const prevFiltered = useMemo(() => filterByDate(rows, prevRange), [rows, prevRange]);
  const showCompare  = !!(dateRange.from || dateRange.to);

  return (
    <Layout
      tab={tab} setTab={setTab}
      dark={dark} toggleTheme={toggle}
      updatedAt={updatedAt}
      onRefresh={refresh} refreshing={refreshing}
      dateRange={dateRange} onDateChange={setDateRange}
    >
      {loading ? (
        <SkeletonPage />
      ) : error ? (
        <ErrorBanner error={error} onRetry={load} />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            variants={pageVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            {tab === 'overview'    && <Overview rows={dateFiltered} prevRows={prevFiltered} showCompare={showCompare} />}
            {tab === 'staff'       && <Staff rows={dateFiltered} />}
            {tab === 'points'      && <Points rows={dateFiltered} />}
            {tab === 'departments' && <Departments rows={deptFiltered} />}
          </motion.div>
        </AnimatePresence>
      )}
    </Layout>
  );
}