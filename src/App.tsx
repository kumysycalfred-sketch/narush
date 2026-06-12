import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SheetRow, Tab, DateRange } from './types';
import { fetchSheet } from './api/fetchSheet';
import { parseRows } from './utils/parse';
import { filterByDate } from './utils/aggregate';
import { useTheme } from './hooks/useTheme';
import Layout from './components/Layout';
import { SkeletonPage } from './components/Skeleton';
import Overview from './pages/Overview';
import Staff from './pages/Staff';
import Points from './pages/Points';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
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
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [load]);

  const dateFiltered = useMemo(() => filterByDate(rows, dateRange), [rows, dateRange]);

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
            {tab === 'overview' && <Overview rows={dateFiltered} />}
            {tab === 'staff'    && <Staff rows={dateFiltered} />}
            {tab === 'points'   && <Points rows={dateFiltered} />}
          </motion.div>
        </AnimatePresence>
      )}
    </Layout>
  );
}
