import { useState, useCallback, useMemo } from 'react';
import type { HKStock } from '../data/hk-stocks';
import { useLang } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/dictionaries';

interface MemoGeneratorProps {
  stock: HKStock | null;
}

interface ParsedMemo {
  bullPoints: string[];
  bearPoints: string[];
  keyRisk: string;
  verdict: string;
}

/** 把流式 Markdown 粗略解析为 Bull / Bear / Risk / Verdict 四块 */
function parseMemo(raw: string): ParsedMemo {
  const result: ParsedMemo = {
    bullPoints: [],
    bearPoints: [],
    keyRisk: '',
    verdict: '',
  };
  if (!raw) return result;

  const lines = raw.split('\n');
  let current: 'bull' | 'bear' | 'risk' | 'verdict' | null = null;
  const bullBuf: string[] = [];
  const bearBuf: string[] = [];
  const riskBuf: string[] = [];
  const verdictBuf: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const lower = line.toLowerCase();
    if (lower.includes('**bull case**') || lower.startsWith('bull case')) {
      current = 'bull';
      continue;
    }
    if (lower.includes('**bear case**') || lower.startsWith('bear case')) {
      current = 'bear';
      continue;
    }
    if (lower.includes('**key risk**') || lower.startsWith('key risk')) {
      current = 'risk';
      continue;
    }
    if (lower.includes('**verdict**') || lower.startsWith('verdict')) {
      current = 'verdict';
      continue;
    }

    if (current === 'bull' && line.startsWith('-')) {
      bullBuf.push(line.replace(/^-\s*/, ''));
    } else if (current === 'bear' && line.startsWith('-')) {
      bearBuf.push(line.replace(/^-\s*/, ''));
    } else if (current === 'risk') {
      riskBuf.push(line);
    } else if (current === 'verdict') {
      verdictBuf.push(line);
    }
  }

  result.bullPoints = bullBuf;
  result.bearPoints = bearBuf;
  result.keyRisk = riskBuf.join(' ').trim();
  result.verdict = verdictBuf.join(' ').trim();
  return result;
}

function verdictStyle(verdict: string): {
  color: string;
  bg: string;
  border: string;
  icon: string;
  labelKey: TranslationKey;
} {
  const v = verdict.toLowerCase();
  if (v.includes('bull')) {
    return {
      color: 'text-[#3fb950]',
      bg: 'bg-[#3fb950]/10',
      border: 'border-[#3fb950]/30',
      icon: 'fa-arrow-trend-up',
      labelKey: 'memo.verdict.bull',
    };
  }
  if (v.includes('bear')) {
    return {
      color: 'text-[#f85149]',
      bg: 'bg-[#f85149]/10',
      border: 'border-[#f85149]/30',
      icon: 'fa-arrow-trend-down',
      labelKey: 'memo.verdict.bear',
    };
  }
  return {
    color: 'text-[#d29922]',
    bg: 'bg-[#d29922]/10',
    border: 'border-[#d29922]/30',
    icon: 'fa-scale-balanced',
    labelKey: 'memo.verdict.neutral',
  };
}

const MemoGenerator = ({ stock }: MemoGeneratorProps) => {
  const { t, lang } = useLang();
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = useMemo(() => parseMemo(memo), [memo]);

  const generate = useCallback(async () => {
    if (!stock) return;
    setLoading(true);
    setError(null);
    setMemo('');

    try {
      const response = await fetch('/api/generate-memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockCode: stock.symbol,
          stockName: stock.nameEn,
          financialData: stock.financials,
          segments: stock.segments.map(
            (s) => `${s.name}: ${s.value.toLocaleString()} M HKD`,
          ),
          language: lang,
        }),
      });

      if (!response.ok || !response.body) {
        const text = await response.text().catch(() => '');
        throw new Error(text || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Accumulate into a local variable so we flush once at the end,
      // avoiding the (previously observed) issue where the very last
      // setMemo call was dropped before re-render.
      let accumulated = '';

      const processLines = (lines: string[]) => {
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const chunk = line.slice(6);
            if (chunk && chunk !== '[DONE]') {
              // Backend escapes \n -> \\n so each SSE event stays one line;
              // decode it back here.
              const decoded = chunk.replace(/\\n/g, '\n');
              accumulated += decoded;
              // Push to React state so the UI updates live as chunks arrive.
              setMemo(accumulated);
            }
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        processLines(lines);
      }

      // Flush trailing buffer — the last SSE event may arrive without a
      // final newline, and without this its content would be silently
      // dropped (manifested as truncation at the end of Verdict).
      buffer += decoder.decode();
      if (buffer.length > 0) {
        processLines([buffer]);
      }

      // Final authoritative set — protects against any in-flight setState
      // being swallowed by React batching at stream end.
      setMemo(accumulated);

      // Debug: log the complete accumulated memo so we can verify the
      // browser actually received everything. Compare this in the Console
      // against what the UI renders — if they disagree, the parser is wrong;
      // if they agree but differ from the /api/generate-memo Response tab,
      // the frontend dropped chunks.
      console.log(
        '%c[memo] stream finished, total chars:',
        'color:#3fb950',
        accumulated.length,
      );
      console.log(accumulated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '生成失败';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [stock]);

  if (!stock) {
    return (
      <div className="rounded-2xl border border-dashed border-[#30363d] bg-[#0d1117]/30 p-10 text-center">
        <i className="fa-solid fa-file-invoice text-[#484f58] text-3xl mb-3" />
        <p className="text-[#8b949e] text-sm">{t('memo.emptyNoStock')}</p>
      </div>
    );
  }

  const verdict = verdictStyle(parsed.verdict);
  const hasContent = memo.length > 0;
  const stockDisplayName = lang === 'en' ? stock.nameEn : stock.name;

  return (
    <div className="rounded-2xl bg-[#161b27] border border-[#30363d] overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-6 py-4 border-b border-[#21262d]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <i className="fa-solid fa-wand-magic-sparkles text-[#a371f7] text-sm" />
            <h3 className="text-[#e6edf3] text-base font-semibold">
              {t('memo.title')}
            </h3>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold
                             bg-[#a371f7]/10 text-[#a371f7] border border-[#a371f7]/30 uppercase tracking-widest">
              {t('memo.poweredBy')}
            </span>
          </div>
          <p className="text-[#8b949e] text-xs font-mono">
            {stock.symbol} · {stockDisplayName} · {stock.sector}
          </p>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl
                     bg-[#3fb950] hover:bg-[#2ea043] disabled:opacity-40 disabled:cursor-not-allowed
                     text-[#0d1117] text-sm font-semibold transition-colors whitespace-nowrap"
        >
          {loading ? (
            <>
              <i className="fa-solid fa-circle-notch animate-spin" />
              {t('memo.generating')}
            </>
          ) : hasContent ? (
            <>
              <i className="fa-solid fa-rotate-right" />
              {t('memo.regenerate')}
            </>
          ) : (
            <>
              <i className="fa-solid fa-bolt" />
              {t('memo.generate')}
            </>
          )}
        </button>
      </div>

      {/* Body */}
      <div className="p-6">
        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg border border-[#f85149]/30 bg-[#f85149]/10
                          text-[#f85149] text-sm flex items-start gap-2">
            <i className="fa-solid fa-circle-exclamation mt-0.5" />
            <div>
              <div className="font-medium">{t('memo.error.title')}</div>
              <div className="text-xs mt-0.5 text-[#f85149]/80">{error}</div>
            </div>
          </div>
        )}

        {!hasContent && !loading && !error && (
          <div className="py-16 text-center">
            <i className="fa-solid fa-sparkles text-[#484f58] text-3xl mb-3" />
            <p className="text-[#8b949e] text-sm">{t('memo.empty')}</p>
          </div>
        )}

        {hasContent && (
          <div className="space-y-6">
            {/* Bull / Bear 并列 */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Bull */}
              <div className="rounded-xl border border-[#3fb950]/30 bg-[#3fb950]/5 p-5 min-h-[280px]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#3fb950]/10 flex items-center justify-center">
                    <i className="fa-solid fa-arrow-trend-up text-[#3fb950]" />
                  </div>
                  <h4 className="text-[#3fb950] text-sm font-bold uppercase tracking-widest">
                    {t('memo.bullCase')}
                  </h4>
                </div>
                {parsed.bullPoints.length === 0 ? (
                  <p className="text-[#484f58] text-sm italic">{t('memo.waitingAI')}</p>
                ) : (
                  <ul className="space-y-3">
                    {parsed.bullPoints.map((point, i) => (
                      <li key={i} className="flex gap-2 text-[#c9d1d9] text-sm leading-7">
                        <span className="text-[#3fb950] font-mono font-semibold flex-shrink-0">
                          {i + 1}.
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Bear */}
              <div className="rounded-xl border border-[#d29922]/30 bg-[#d29922]/5 p-5 min-h-[280px]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#d29922]/10 flex items-center justify-center">
                    <i className="fa-solid fa-arrow-trend-down text-[#d29922]" />
                  </div>
                  <h4 className="text-[#d29922] text-sm font-bold uppercase tracking-widest">
                    {t('memo.bearCase')}
                  </h4>
                </div>
                {parsed.bearPoints.length === 0 ? (
                  <p className="text-[#484f58] text-sm italic">{t('memo.waitingAI')}</p>
                ) : (
                  <ul className="space-y-3">
                    {parsed.bearPoints.map((point, i) => (
                      <li key={i} className="flex gap-2 text-[#c9d1d9] text-sm leading-7">
                        <span className="text-[#d29922] font-mono font-semibold flex-shrink-0">
                          {i + 1}.
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Key Risk */}
            {parsed.keyRisk && (
              <div className="rounded-xl border border-[#f85149]/30 bg-[#f85149]/5 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <i className="fa-solid fa-triangle-exclamation text-[#f85149]" />
                  <h4 className="text-[#f85149] text-sm font-bold uppercase tracking-widest">
                    {t('memo.keyRisk')}
                  </h4>
                </div>
                <p className="text-[#c9d1d9] text-sm leading-7">{parsed.keyRisk}</p>
              </div>
            )}

            {/* Verdict */}
            {parsed.verdict && (
              <div className={`rounded-xl border ${verdict.border} ${verdict.bg} p-5
                               flex items-center gap-4`}>
                <div className={`w-12 h-12 rounded-xl ${verdict.bg} border ${verdict.border}
                                 flex items-center justify-center flex-shrink-0`}>
                  <i className={`fa-solid ${verdict.icon} ${verdict.color} text-xl`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-mono font-bold uppercase tracking-widest ${verdict.color}`}>
                      {t('memo.verdict')} · {t(verdict.labelKey)}
                    </span>
                  </div>
                  <p className="text-[#e6edf3] text-sm leading-6">{parsed.verdict}</p>
                </div>
              </div>
            )}

            {/* 生成中光标 */}
            {loading && (
              <div className="text-[#8b949e] text-xs flex items-center gap-2">
                <span className="inline-block w-2 h-4 bg-[#3fb950] animate-pulse" />
                {t('memo.streaming')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoGenerator;
