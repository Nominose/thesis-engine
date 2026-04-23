export type Lang = 'en' | 'zh';

export const dictionaries = {
  en: {
    // Header
    'header.tagline': 'AI-Powered HK Stock Memo Generator',
    'header.status': 'Sprint 1 · 5 Tickers Cached',
    'header.switchLang': '中文',

    // Hero
    'hero.badge': 'Bull · Bear · Balanced',
    'hero.title.line1': 'Turn a HK ticker into a',
    'hero.title.line2': 'structured investment memo',
    'hero.subtitle':
      'Retail investors usually see either one-sided reports or generic news summaries. Thesis Engine presents the Bull Case and the Bear Case side by side with equal weight — so you see both sides before you decide.',

    // Financial Snapshot
    'snapshot.title': 'Financial Snapshot · FY2024',
    'snapshot.revenue': 'Revenue',
    'snapshot.netIncome': 'Net Income',
    'snapshot.growth': 'Revenue Growth',
    'snapshot.grossMargin': 'Gross Margin',
    'snapshot.pe': 'P/E Ratio',
    'snapshot.marketCap': 'Market Cap',
    'snapshot.unitMHKD': 'M HKD',
    'snapshot.unitBHKD': 'B HKD',

    // Search
    'search.placeholder': 'Search HK ticker / name (e.g. 0700 Tencent)',
    'search.empty': 'No matching HK stock',

    // Memo
    'memo.title': 'AI Investment Memo',
    'memo.poweredBy': 'Powered by Gemini',
    'memo.generate': 'Generate Bull / Bear Analysis',
    'memo.regenerate': 'Regenerate',
    'memo.generating': 'Generating...',
    'memo.streaming': 'AI is streaming output...',
    'memo.empty':
      'Click the button to stream a structured investment memo based on the financial data.',
    'memo.emptyNoStock':
      'Select a HK ticker to generate a Bull / Bear memo with one click.',
    'memo.waitingAI': 'Waiting for AI...',
    'memo.bullCase': 'Bull Case',
    'memo.bearCase': 'Bear Case',
    'memo.keyRisk': 'Key Risk',
    'memo.verdict': 'Verdict',
    'memo.verdict.bull': 'BULLISH',
    'memo.verdict.bear': 'BEARISH',
    'memo.verdict.neutral': 'NEUTRAL',
    'memo.error.title': 'Generation failed',

    // Revenue
    'revenue.title': 'Revenue Segment Breakdown',
    'revenue.totalLabel': 'Total Revenue',
    'revenue.emptyNoStock': 'Select a HK ticker to see the revenue breakdown',
    'revenue.back': 'Back to parent',
    'revenue.col.segment': 'Segment',
    'revenue.col.value': 'Revenue (M HKD)',
    'revenue.col.share': 'Share',
    'revenue.tooltip.revenue': 'Revenue',
    'revenue.tooltip.unit': 'M HKD',

    // Footer
    'footer.team': '© 2026 Team Expedition 33 · XJTLU ENT208TC',
    'footer.disclaimer': 'Sprint 1 demo · Cached data · Not investment advice',

    // Comparison Module
    'comparison.title': 'Dual Stock Comparison',
    'comparison.subtitle': 'Side-by-side comparison of key financial metrics',
    'comparison.instructions': 'Select two stocks to compare their key metrics',
    'comparison.selectLeft': 'Select Left Stock',
    'comparison.selectRight': 'Select Right Stock',
    'comparison.vs': 'VS',
    'comparison.currentPrice': 'Current Price',
    'comparison.changePercent': 'Change %',
    'comparison.peRatio': 'P/E Ratio',
    'comparison.pbRatio': 'P/B Ratio',
    'comparison.dividendYield': 'Dividend Yield',
    'comparison.roe': 'ROE',
    'comparison.better': 'Better',
    'comparison.worse': 'Worse',
  },
  zh: {
    // Header
    'header.tagline': 'AI 港股投资备忘录生成器',
    'header.status': 'Sprint 1 · 已缓存 5 只股票',
    'header.switchLang': 'EN',

    // Hero
    'hero.badge': '牛市 · 熊市 · 均衡',
    'hero.title.line1': '一键把港股代码变成',
    'hero.title.line2': '结构化投资备忘录',
    'hero.subtitle':
      '散户看到的要么是单边研报，要么是泛泛新闻摘要。Thesis Engine 把 Bull Case 和 Bear Case 等权重并排呈现，做决策前看清两面。',

    // Financial Snapshot
    'snapshot.title': '财务快照 · FY2024',
    'snapshot.revenue': '营收',
    'snapshot.netIncome': '净利润',
    'snapshot.growth': '营收增速',
    'snapshot.grossMargin': '毛利率',
    'snapshot.pe': '市盈率',
    'snapshot.marketCap': '市值',
    'snapshot.unitMHKD': '百万港元',
    'snapshot.unitBHKD': '十亿港元',

    // Search
    'search.placeholder': '搜索港股代码 / 名称（如 0700 腾讯）',
    'search.empty': '未找到匹配的港股',

    // Memo
    'memo.title': 'AI 投资备忘录',
    'memo.poweredBy': 'Powered by Gemini',
    'memo.generate': '生成 Bull / Bear 分析',
    'memo.regenerate': '重新生成',
    'memo.generating': '正在生成...',
    'memo.streaming': 'AI 正在流式输出...',
    'memo.empty': '点击按钮，AI 将基于财务数据流式生成结构化投资备忘录',
    'memo.emptyNoStock': '选择一只港股后，一键生成 Bull / Bear 投资备忘录',
    'memo.waitingAI': '等待 AI 生成...',
    'memo.bullCase': 'Bull Case',
    'memo.bearCase': 'Bear Case',
    'memo.keyRisk': 'Key Risk',
    'memo.verdict': 'Verdict',
    'memo.verdict.bull': '看多',
    'memo.verdict.bear': '看空',
    'memo.verdict.neutral': '中性',
    'memo.error.title': '生成失败',

    // Revenue
    'revenue.title': '营收细分拆解',
    'revenue.totalLabel': '总营收',
    'revenue.emptyNoStock': '请先选择一只港股查看营收拆解',
    'revenue.back': '返回上一级',
    'revenue.col.segment': '业务板块',
    'revenue.col.value': '营收(百万港元)',
    'revenue.col.share': '占比',
    'revenue.tooltip.revenue': '营收',
    'revenue.tooltip.unit': '百万港元',

    // Footer
    'footer.team': '© 2026 Team Expedition 33 · XJTLU ENT208TC',
    'footer.disclaimer': 'Sprint 1 演示 · 缓存数据 · 不构成投资建议',

    // 对比模块
    'comparison.title': '双股对比',
    'comparison.subtitle': '并排比较两只股票的核心财务指标',
    'comparison.instructions': '选择两只股票比较核心指标',
    'comparison.selectLeft': '选择左侧股票',
    'comparison.selectRight': '选择右侧股票',
    'comparison.vs': 'VS',
    'comparison.currentPrice': '当前价格',
    'comparison.changePercent': '涨跌幅',
    'comparison.peRatio': '市盈率',
    'comparison.pbRatio': '市净率',
    'comparison.dividendYield': '股息率',
    'comparison.roe': '净资产收益率',
    'comparison.better': '占优',
    'comparison.worse': '落后',
  },
} as const;

export type TranslationKey = keyof (typeof dictionaries)['en'];
