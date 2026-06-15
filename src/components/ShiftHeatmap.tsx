import { motion } from 'framer-motion';

interface HeatRow { point: string; day: number; night: number }
interface Props { data: HeatRow[]; title: string }

export default function ShiftHeatmap({ data, title }: Props) {
  if (!data.length) return null;
  const max = Math.max(...data.flatMap(d => [d.day, d.night]), 1);

  const bg = (val: number): string | undefined => {
    if (!val) return undefined;
    const alpha = 0.12 + (val / max) * 0.78;
    return `rgba(211,43,56,${alpha.toFixed(2)})`;
  };

  return (
    <div className="rounded-lg p-5 col-span-1 md:col-span-2" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      <h3 className="text-primary font-semibold text-sm mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="text-secondary text-left font-medium pb-3 pr-4">Точка</th>
              <th className="text-secondary text-center font-medium pb-3 w-20">☀️ День</th>
              <th className="text-secondary text-center font-medium pb-3 w-20">🌙 Ночь</th>
              <th className="text-secondary text-center font-medium pb-3 w-16">Итого</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <motion.tr
                key={row.point}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                className="border-t border-[var(--border-color)]"
              >
                <td className="py-2 pr-4 text-primary truncate max-w-[180px]">{row.point}</td>
                <td className="py-1.5 px-1 text-center">
                  <span
                    className="inline-block w-14 py-1 rounded font-mono font-semibold text-center"
                    style={{ background: bg(row.day), color: row.day ? '#fff' : 'var(--text-secondary)' }}
                  >
                    {row.day || '—'}
                  </span>
                </td>
                <td className="py-1.5 px-1 text-center">
                  <span
                    className="inline-block w-14 py-1 rounded font-mono font-semibold text-center"
                    style={{ background: bg(row.night), color: row.night ? '#fff' : 'var(--text-secondary)' }}
                  >
                    {row.night || '—'}
                  </span>
                </td>
                <td className="py-1.5 text-center text-secondary font-mono">{row.day + row.night}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}