import { useState } from 'react';
import StockCodeSearch from './components/StockCodeSearch';
import RevenueSegmentBreakdown from './components/RevenueSegmentBreakdown';
import MemoGenerator from './components/MemoGenerator';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { HKStock } from './data/hk-stocks';
import { useLang } from './i18n/LanguageContext';

const queryClient = new QueryClient();

function FinancialCard({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: string;
  suffix?: string;
  tone?: 'bull' | 'bear' | 'neutral';
}) {
  const toneColor =
    tone === 'bull'
      ? 'text-[#3fb950]'
      : tone === 'bear'
        ? 'text-[#f85149]'
        : 'text-[#e6edf3]';
  return (
    <div className="rounded-xl bg-[#0d1117] border border-[#21262d] px-4 py-3.5 hover:border-[#30363d] transition-colors">
      <div className="text-[#8b949e] text-xs uppercase tracking-widest mb-1.5">
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`font-mono text-lg font-semibold ${toneColor}`}>
          {value}
        </span>
        {suffix && <span className="text-[#8b949e] text-xs">{suffix}</span>}
      </div>
    </div>
  );
}

function LanguageToggle() {
  const { lang, toggle, t } = useLang();
  return (
    <button
      onClick={toggle}
      title={lang === 'en' ? '切换到中文' : 'Switch to English'}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                 bg-[#161b27] border border-[#21262d]
                 hover:border-[#30363d] hover:bg-[#1e2736]
                 text-[#c9d1d9] text-xs font-medium transition-colors"
    >
      <i className="fa-solid fa-language text-[#8b949e]" />
      <span className="font-mono">{t('header.switchLang')}</span>
    </button>
  );
}

function AppContent() {
  const { t, lang } = useLang();
  const [selected, setSelected] = useState<HKStock | null>(null);

  // Localize the stock name for display (English name if en, Chinese name if zh)
  const displayName = (s: HKStock) => (lang === 'en' ? s.nameEn : s.name);

  return (
    <div className="min-h-screen bg-[#0a0e16]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0d1117]/95 backdrop-blur-md border-b border-[#21262d]">
        <div className="max-w-7xl mx-auto px-6 md:px-8 lg:px-10 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-[#3fb950] to-[#2ea043]
                            flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-chart-line text-[#0d1117] text-lg" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[#e6edf3] text-base font-bold leading-tight">
                Thesis Engine
              </h1>
              <p className="text-[#8b949e] text-xs leading-tight truncate">
                {t('header.tagline')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg
                            bg-[#161b27] border border-[#21262d]">
              <span className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse" />
              <span className="text-[#8b949e] text-xs font-mono">
                {t('header.status')}
              </span>
            </div>
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 md:px-8 lg:px-10 py-10 md:py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                          bg-[#3fb950]/10 border border-[#3fb950]/30 mb-6">
            <i className="fa-solid fa-bolt text-[#3fb950] text-xs" />
            <span className="text-[#3fb950] text-xs font-mono font-semibold uppercase tracking-widest">
              {t('hero.badge')}
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-[#e6edf3] mb-4 leading-tight">
            {t('hero.title.line1')}
            <br />
            <span className="bg-gradient-to-b from-[#3fb950] to-[#2ea043] bg-clip-text text-transparent">
              {t('hero.title.line2')}
            </span>
          </h2>
          <p className="text-[#8b949e] text-base md:text-lg max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-10">
          <StockCodeSearch onSelect={setSelected} selected={selected} />
        </div>

        {/* Financial snapshot */}
        {selected && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <i className="fa-solid fa-receipt text-[#8b949e] text-sm" />
              <h3 className="text-[#8b949e] text-xs font-mono font-semibold uppercase tracking-widest">
                {t('snapshot.title')} · {displayName(selected)}
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <FinancialCard
                label={t('snapshot.revenue')}
                value={selected.financials.revenue.toLocaleString()}
                suffix={t('snapshot.unitMHKD')}
              />
              <FinancialCard
                label={t('snapshot.netIncome')}
                value={selected.financials.netIncome.toLocaleString()}
                suffix={t('snapshot.unitMHKD')}
                tone="bull"
              />
              <FinancialCard
                label={t('snapshot.growth')}
                value={`${selected.financials.revenueGrowth > 0 ? '+' : ''}${selected.financials.revenueGrowth}`}
                suffix="%"
                tone={selected.financials.revenueGrowth >= 0 ? 'bull' : 'bear'}
              />
              <FinancialCard
                label={t('snapshot.grossMargin')}
                value={selected.financials.grossMargin.toFixed(1)}
                suffix="%"
              />
              <FinancialCard
                label={t('snapshot.pe')}
                value={selected.financials.peRatio.toFixed(1)}
                suffix="x"
              />
              <FinancialCard
                label={t('snapshot.marketCap')}
                value={selected.financials.marketCap.toLocaleString()}
                suffix={t('snapshot.unitBHKD')}
              />
            </div>
          </div>
        )}

        {/* Memo + Revenue */}
        <div className="space-y-6">
          <MemoGenerator stock={selected} />
          <RevenueSegmentBreakdown stockCode={selected?.symbol ?? ''} />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#21262d] mt-10">
        <div className="max-w-7xl mx-auto px-6 md:px-8 lg:px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-[#484f58] text-xs font-mono">{t('footer.team')}</p>
          <p className="text-[#484f58] text-xs">{t('footer.disclaimer')}</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
