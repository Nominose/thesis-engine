import { useState, useEffect, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { findStock, type RevenueSegment } from '../data/hk-stocks';
import { useLang } from '../i18n/LanguageContext';

interface RevenueSegmentBreakdownProps {
  stockCode: string;
}

const RevenueSegmentBreakdown = ({ stockCode }: RevenueSegmentBreakdownProps) => {
  const { t, lang } = useLang();
  const stock = useMemo(() => findStock(stockCode), [stockCode]);

  const [segmentData, setSegmentData] = useState<RevenueSegment[]>([]);
  const [currentLevel, setCurrentLevel] = useState<string>('');
  const [parentStack, setParentStack] = useState<
    { data: RevenueSegment[]; level: string }[]
  >([]);

  // Reset when stock changes OR language changes (so the "Total Revenue" label re-renders)
  useEffect(() => {
    if (stock) {
      const displayName = lang === 'en' ? stock.nameEn : stock.name;
      setSegmentData(stock.segments);
      setCurrentLevel(`${displayName} · ${t('revenue.totalLabel')}`);
      setParentStack([]);
    }
  }, [stock, lang, t]);

  const handleDrillDown = (item: RevenueSegment) => {
    if (item.children && item.children.length > 0) {
      setParentStack((prev) => [...prev, { data: segmentData, level: currentLevel }]);
      setSegmentData(item.children);
      const itemLabel = lang === 'en' ? item.nameEn : item.name;
      setCurrentLevel(`${currentLevel} › ${itemLabel}`);
    }
  };

  const handleBack = () => {
    const last = parentStack[parentStack.length - 1];
    if (last) {
      setSegmentData(last.data);
      setCurrentLevel(last.level);
      setParentStack((prev) => prev.slice(0, -1));
    }
  };

  if (!stock) {
    return (
      <div className="rounded-2xl border border-dashed border-[#30363d] bg-[#0d1117]/30 p-10 text-center">
        <i className="fa-solid fa-chart-pie text-[#484f58] text-3xl mb-3" />
        <p className="text-[#8b949e] text-sm">{t('revenue.emptyNoStock')}</p>
      </div>
    );
  }

  const totalValue = segmentData.reduce((sum, s) => sum + Math.abs(s.value), 0);
  const hasDrillable = segmentData.some((s) => s.children && s.children.length > 0);

  // Derive localized segment data for rendering. We keep the raw state in
  // `segmentData` (so drill-down still has the original children) and spread
  // each item with `name` replaced by the current language's label.
  const displayData = segmentData.map((s) => ({
    ...s,
    name: lang === 'en' ? s.nameEn : s.name,
  }));

  return (
    <div className="rounded-2xl bg-[#161b27] border border-[#30363d] overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#21262d]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <i className="fa-solid fa-chart-pie text-[#a371f7] text-sm" />
            <h3 className="text-[#e6edf3] text-base font-semibold">
              {t('revenue.title')}
            </h3>
          </div>
          <p className="text-[#8b949e] text-xs truncate font-mono">{currentLevel}</p>
        </div>
        {parentStack.length > 0 && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md
                       text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#1e2736]
                       text-xs transition-colors"
          >
            <i className="fa-solid fa-arrow-left text-xs" />
            {t('revenue.back')}
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6 p-6">
        {/* 饼图 */}
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                outerRadius={90}
                dataKey="value"
                onClick={(data) => handleDrillDown(data as unknown as RevenueSegment)}
                style={{ cursor: hasDrillable ? 'pointer' : 'default', outline: 'none' }}
              >
                {displayData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="#0d1117"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#0d1117',
                  border: '1px solid #30363d',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#e6edf3' }}
                itemStyle={{ color: '#c9d1d9' }}
                formatter={(value: number) => [
                  `${value.toLocaleString()} ${t('revenue.tooltip.unit')}`,
                  t('revenue.tooltip.revenue'),
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', color: '#8b949e' }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 明细表格 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#21262d]">
                <th className="text-left py-2 text-[#8b949e] text-xs font-medium uppercase tracking-widest">
                  {t('revenue.col.segment')}
                </th>
                <th className="text-right py-2 text-[#8b949e] text-xs font-medium uppercase tracking-widest">
                  {t('revenue.col.value')}
                </th>
                <th className="text-right py-2 text-[#8b949e] text-xs font-medium uppercase tracking-widest">
                  {t('revenue.col.share')}
                </th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((item) => {
                const percent = totalValue
                  ? ((Math.abs(item.value) / totalValue) * 100).toFixed(1)
                  : '0.0';
                const drillable = !!(item.children && item.children.length > 0);
                return (
                  <tr
                    key={item.name}
                    className={`border-b border-[#21262d] transition-colors
                                ${drillable ? 'cursor-pointer hover:bg-[#1e2736]' : ''}`}
                    onClick={() => drillable && handleDrillDown(item)}
                  >
                    <td className="py-3 text-[#e6edf3]">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.name}</span>
                        {drillable && (
                          <i className="fa-solid fa-chevron-right text-[#484f58] text-[10px] ml-0.5" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-right font-mono text-[#c9d1d9]">
                      {item.value.toLocaleString()}
                    </td>
                    <td className="py-3 text-right font-mono text-[#8b949e]">{percent}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RevenueSegmentBreakdown;
