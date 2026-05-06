import { useLang } from '../i18n/LanguageContext';
import type { HKStock } from '../data/hk-stocks';

interface ComparisonTableProps {
  leftStock: HKStock | null;
  rightStock: HKStock | null;
}

export default function ComparisonTable({ leftStock, rightStock }: ComparisonTableProps) {
  const { t } = useLang();

  if (!leftStock && !rightStock) {
    return null;
  }

  const metrics = [
    {
      key: 'currentPrice',
      label: t('comparison.currentPrice'),
      format: (value: number) => `HK$${value.toFixed(2)}`,
      better: (a: number, b: number) => a > b, // 价格越高越好
    },
    {
      key: 'changePercent',
      label: t('comparison.changePercent'),
      format: (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`,
      better: (a: number, b: number) => a > b, // 涨幅越大越好
    },
    {
      key: 'peRatio',
      label: t('comparison.peRatio'),
      format: (value: number) => `${value.toFixed(1)}x`,
      better: (a: number, b: number) => a < b, // PE越低越好
    },
    {
      key: 'pbRatio',
      label: t('comparison.pbRatio'),
      format: (value: number) => `${value.toFixed(1)}x`,
      better: (a: number, b: number) => a < b, // PB越低越好
    },
    {
      key: 'dividendYield',
      label: t('comparison.dividendYield'),
      format: (value: number) => `${value.toFixed(2)}%`,
      better: (a: number, b: number) => a > b, // 股息率越高越好
    },
    {
      key: 'roe',
      label: t('comparison.roe'),
      format: (value: number) => `${value.toFixed(1)}%`,
      better: (a: number, b: number) => a > b, // ROE越高越好
    },
  ];

  return (
    <div className="rounded-xl border border-[#21262d] bg-[#0d1117] p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <i className="fa-solid fa-scale-balanced text-[#8b949e] text-sm" />
          <h3 className="text-[#e6edf3] text-base font-semibold">
            {t('comparison.title')}
          </h3>
        </div>
        <p className="text-[#8b949e] text-sm">
          {t('comparison.subtitle')}
        </p>
      </div>

      {/* Stock Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Left Stock Card */}
        <div className={`rounded-lg border-2 ${leftStock ? 'border-[#3fb950]/30' : 'border-dashed border-[#30363d]'} bg-[#161b22] p-4`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[#8b949e] text-xs uppercase tracking-widest mb-1">
                {t('comparison.selectLeft')}
              </div>
              {leftStock ? (
                <>
                  <div className="text-[#e6edf3] font-mono font-semibold text-lg">
                    {leftStock.symbol}
                  </div>
                  <div className="text-[#8b949e] text-sm">
                    {useLang().lang === 'en' ? leftStock.nameEn : leftStock.name}
                  </div>
                </>
              ) : (
                <div className="text-[#484f58] text-sm italic">
                  {t('comparison.selectLeft')}
                </div>
              )}
            </div>
            {leftStock && (
              <div className="text-right">
                <div className="text-[#e6edf3] font-semibold text-lg">
                  HK${leftStock.financials.currentPrice.toFixed(2)}
                </div>
                <div className={`text-xs ${leftStock.financials.changePercent >= 0 ? 'text-[#3fb950]' : 'text-[#f85149]'}`}>
                  {leftStock.financials.changePercent >= 0 ? '+' : ''}
                  {leftStock.financials.changePercent.toFixed(2)}%
                </div>
              </div>
            )}
          </div>
        </div>

        {/* VS Divider */}
        <div className="flex items-center justify-center">
          <div className="px-3 py-1 rounded-full bg-[#161b22] border border-[#21262d] text-[#8b949e] font-mono font-semibold text-sm">
            {t('comparison.vs')}
          </div>
        </div>

        {/* Right Stock Card */}
        <div className={`rounded-lg border-2 ${rightStock ? 'border-[#3fb950]/30' : 'border-dashed border-[#30363d]'} bg-[#161b22] p-4`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[#8b949e] text-xs uppercase tracking-widest mb-1">
                {t('comparison.selectRight')}
              </div>
              {rightStock ? (
                <>
                  <div className="text-[#e6edf3] font-mono font-semibold text-lg">
                    {rightStock.symbol}
                  </div>
                  <div className="text-[#8b949e] text-sm">
                    {useLang().lang === 'en' ? rightStock.nameEn : rightStock.name}
                  </div>
                </>
              ) : (
                <div className="text-[#484f58] text-sm italic">
                  {t('comparison.selectRight')}
                </div>
              )}
            </div>
            {rightStock && (
              <div className="text-right">
                <div className="text-[#e6edf3] font-semibold text-lg">
                  HK${rightStock.financials.currentPrice.toFixed(2)}
                </div>
                <div className={`text-xs ${rightStock.financials.changePercent >= 0 ? 'text-[#3fb950]' : 'text-[#f85149]'}`}>
                  {rightStock.financials.changePercent >= 0 ? '+' : ''}
                  {rightStock.financials.changePercent.toFixed(2)}%
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      {leftStock && rightStock && (
        <div className="overflow-hidden rounded-lg border border-[#21262d]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#21262d] bg-[#161b22]">
                <th className="py-3 px-4 text-left text-[#8b949e] text-xs uppercase tracking-widest">
                  {t('comparison.currentPrice')}
                </th>
                <th className="py-3 px-4 text-center text-[#8b949e] text-xs uppercase tracking-widest">
                  {leftStock.symbol}
                </th>
                <th className="py-3 px-4 text-center text-[#8b949e] text-xs uppercase tracking-widest">
                  {t('comparison.vs')}
                </th>
                <th className="py-3 px-4 text-center text-[#8b949e] text-xs uppercase tracking-widest">
                  {rightStock.symbol}
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, index) => {
                const leftValue = leftStock.financials[metric.key as keyof typeof leftStock.financials] as number;
                const rightValue = rightStock.financials[metric.key as keyof typeof rightStock.financials] as number;
                const leftBetter = metric.better(leftValue, rightValue);
                const rightBetter = metric.better(rightValue, leftValue);

                return (
                  <tr key={metric.key} className={index % 2 === 0 ? 'bg-[#0d1117]' : 'bg-[#161b22]'}>
                    <td className="py-3 px-4 text-[#8b949e] text-sm font-medium">
                      {metric.label}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-[#e6edf3] font-mono font-semibold">
                          {metric.format(leftValue)}
                        </span>
                        {leftBetter && (
                          <span className="px-2 py-0.5 rounded bg-[#3fb950]/20 text-[#3fb950] text-xs font-medium">
                            {t('comparison.better')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-[#8b949e] font-mono">
                      {leftBetter ? '←' : rightBetter ? '→' : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-[#e6edf3] font-mono font-semibold">
                          {metric.format(rightValue)}
                        </span>
                        {rightBetter && (
                          <span className="px-2 py-0.5 rounded bg-[#3fb950]/20 text-[#3fb950] text-xs font-medium">
                            {t('comparison.better')}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}