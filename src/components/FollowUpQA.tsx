import { useState, useCallback } from 'react';
import { useLang } from '../i18n/LanguageContext';
import type { HKStock } from '../data/hk-stocks';

interface FollowUpQAProps {
  stock: HKStock | null;
  memo: string;
}

const FollowUpQA = ({ stock, memo }: FollowUpQAProps) => {
  const { t, lang } = useLang();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !memo) return;

    setLoading(true);
    setError(null);
    setAnswer('');

    try {
      const response = await fetch('/api/follow-up-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          memo,
          stockCode: stock?.symbol,
          stockName: stock?.nameEn,
          language: lang,
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setAnswer(data.answer || '');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '请求失败';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [question, memo, stock, lang]);

  if (!memo) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-[#161b27] border border-[#30363d] overflow-hidden mt-6">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#21262d]">
        <div className="flex items-center gap-2 mb-1">
          <i className="fa-solid fa-question-circle text-[#6f85d4] text-sm" />
          <h3 className="text-[#e6edf3] text-base font-semibold">
            {t('followUp.title')}
          </h3>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold
                           bg-[#6f85d4]/10 text-[#6f85d4] border border-[#6f85d4]/30 uppercase tracking-widest">
            {t('followUp.poweredBy')}
          </span>
        </div>
        <p className="text-[#8b949e] text-xs font-mono">
          {t('followUp.description')}
        </p>
      </div>

      {/* Body */}
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="question" className="block text-[#8b949e] text-xs font-semibold uppercase tracking-widest mb-2">
              {t('followUp.questionLabel')}
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t('followUp.questionPlaceholder')}
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl bg-[#0d1117] border border-[#30363d] focus:border-[#6f85d4] focus:outline-none
                         text-[#e6edf3] text-sm resize-none min-h-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl
                       bg-[#6f85d4] hover:bg-[#5a6fb7] disabled:opacity-40 disabled:cursor-not-allowed
                       text-[#f0f6fc] text-sm font-semibold transition-colors whitespace-nowrap"
          >
            {loading ? (
              <>
                <i className="fa-solid fa-circle-notch animate-spin" />
                {t('followUp.asking')}
              </>
            ) : (
              <>
                <i className="fa-solid fa-paper-plane" />
                {t('followUp.submit')}
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 px-4 py-3 rounded-lg border border-[#f85149]/30 bg-[#f85149]/10
                          text-[#f85149] text-sm flex items-start gap-2">
            <i className="fa-solid fa-circle-exclamation mt-0.5" />
            <div>
              <div className="font-medium">{t('followUp.error.title')}</div>
              <div className="text-xs mt-0.5 text-[#f85149]/80">{error}</div>
            </div>
          </div>
        )}

        {answer && (
          <div className="mt-4 rounded-xl border border-[#6f85d4]/30 bg-[#6f85d4]/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#6f85d4]/10 flex items-center justify-center">
                <i className="fa-solid fa-robot text-[#6f85d4]" />
              </div>
              <h4 className="text-[#6f85d4] text-sm font-bold uppercase tracking-widest">
                {t('followUp.answer')}
              </h4>
            </div>
            <p className="text-[#c9d1d9] text-sm leading-7 whitespace-pre-line">{answer}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowUpQA;
