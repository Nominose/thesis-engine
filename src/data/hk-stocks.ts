// Sprint 1 cached data for 5 HK tickers.
// Financial numbers are approximations from the most recent annual reports
// (FY2024 / FY2023) and are intended as demo inputs only.

export interface RevenueSegment {
  name: string; // Chinese display name
  nameEn: string; // English display name
  value: number; // in 百万港元 / million HKD
  color: string;
  children?: RevenueSegment[];
}

export interface FinancialData {
  revenue: number; // million HKD
  netIncome: number;
  revenueGrowth: number; // %
  grossMargin: number; // %
  operatingMargin: number; // %
  peRatio: number;
  marketCap: number; // billion HKD
}

export interface HKStock {
  symbol: string; // e.g. "0700.HK"
  code: string; // 4-digit code e.g. "0700"
  name: string;
  nameEn: string;
  exchange: 'HKEX';
  sector: string;
  financials: FinancialData;
  segments: RevenueSegment[];
}

const COLORS = ['#3fb950', '#d29922', '#a371f7', '#3b82f6', '#f85149', '#8b949e'];

export const HK_STOCKS: HKStock[] = [
  {
    symbol: '0700.HK',
    code: '0700',
    name: '腾讯控股',
    nameEn: 'Tencent Holdings',
    exchange: 'HKEX',
    sector: 'Internet / Gaming',
    financials: {
      revenue: 660257,
      netIncome: 194073,
      revenueGrowth: 8.4,
      grossMargin: 52.9,
      operatingMargin: 31.2,
      peRatio: 18.5,
      marketCap: 3850,
    },
    segments: [
      {
        name: '增值服务',
        nameEn: 'Value-Added Services',
        value: 321000,
        color: COLORS[0],
        children: [
          { name: '国内游戏', nameEn: 'Domestic Games', value: 140000, color: '#2ea043' },
          { name: '国际游戏', nameEn: 'International Games', value: 58000, color: '#3fb950' },
          { name: '社交网络', nameEn: 'Social Networks', value: 123000, color: '#56d364' },
        ],
      },
      {
        name: '营销服务',
        nameEn: 'Marketing Services',
        value: 121000,
        color: COLORS[1],
        children: [
          { name: '视频号广告', nameEn: 'Video Accounts Ads', value: 52000, color: '#d29922' },
          { name: '其他广告', nameEn: 'Other Ads', value: 69000, color: '#e3b341' },
        ],
      },
      {
        name: '金融科技及企业服务',
        nameEn: 'FinTech & Business Services',
        value: 212000,
        color: COLORS[2],
        children: [
          { name: '金融科技', nameEn: 'FinTech', value: 138000, color: '#a371f7' },
          { name: '云服务与企业', nameEn: 'Cloud & Enterprise', value: 74000, color: '#bc8cff' },
        ],
      },
      { name: '其他', nameEn: 'Others', value: 6000, color: COLORS[3] },
    ],
  },
  {
    symbol: '1810.HK',
    code: '1810',
    name: '小米集团',
    nameEn: 'Xiaomi Corporation',
    exchange: 'HKEX',
    sector: 'Consumer Electronics / EV',
    financials: {
      revenue: 365906,
      netIncome: 23658,
      revenueGrowth: 35.0,
      grossMargin: 20.9,
      operatingMargin: 7.4,
      peRatio: 28.3,
      marketCap: 1380,
    },
    segments: [
      {
        name: '智能手机',
        nameEn: 'Smartphones',
        value: 191100,
        color: COLORS[0],
        children: [
          { name: '中国大陆', nameEn: 'Mainland China', value: 73000, color: '#2ea043' },
          { name: '海外', nameEn: 'Overseas', value: 118100, color: '#3fb950' },
        ],
      },
      {
        name: 'IoT 与生活消费品',
        nameEn: 'IoT & Lifestyle Products',
        value: 104100,
        color: COLORS[1],
      },
      {
        name: '互联网服务',
        nameEn: 'Internet Services',
        value: 34100,
        color: COLORS[2],
      },
      {
        name: '智能电动汽车等创新业务',
        nameEn: 'Smart EV & New Initiatives',
        value: 32800,
        color: COLORS[3],
        children: [
          { name: 'SU7 整车销售', nameEn: 'SU7 Vehicle Sales', value: 32100, color: '#3b82f6' },
          { name: '其他相关业务', nameEn: 'Related Services', value: 700, color: '#60a5fa' },
        ],
      },
      { name: '其他', nameEn: 'Others', value: 3800, color: COLORS[5] },
    ],
  },
  {
    symbol: '3690.HK',
    code: '3690',
    name: '美团',
    nameEn: 'Meituan',
    exchange: 'HKEX',
    sector: 'Local Services / Food Delivery',
    financials: {
      revenue: 337592,
      netIncome: 35810,
      revenueGrowth: 22.0,
      grossMargin: 38.4,
      operatingMargin: 10.6,
      peRatio: 22.1,
      marketCap: 920,
    },
    segments: [
      {
        name: '核心本地商业',
        nameEn: 'Core Local Commerce',
        value: 250200,
        color: COLORS[0],
        children: [
          { name: '配送服务', nameEn: 'Delivery Services', value: 98000, color: '#2ea043' },
          { name: '佣金', nameEn: 'Commissions', value: 86000, color: '#3fb950' },
          { name: '在线营销服务', nameEn: 'Online Marketing', value: 48000, color: '#56d364' },
          { name: '其他服务及销售', nameEn: 'Other Services & Sales', value: 18200, color: '#6fd97b' },
        ],
      },
      {
        name: '新业务',
        nameEn: 'New Initiatives',
        value: 87400,
        color: COLORS[1],
        children: [
          { name: '美团优选', nameEn: 'Meituan Select', value: 42000, color: '#d29922' },
          { name: '美团买菜等', nameEn: 'Meituan Grocery & Others', value: 45400, color: '#e3b341' },
        ],
      },
    ],
  },
  {
    symbol: '9888.HK',
    code: '9888',
    name: '百度集团',
    nameEn: 'Baidu Inc.',
    exchange: 'HKEX',
    sector: 'Search / AI Cloud',
    financials: {
      revenue: 133125,
      netIncome: 23760,
      revenueGrowth: -1.1,
      grossMargin: 51.8,
      operatingMargin: 19.3,
      peRatio: 10.8,
      marketCap: 310,
    },
    segments: [
      {
        name: '百度核心',
        nameEn: 'Baidu Core',
        value: 104100,
        color: COLORS[0],
        children: [
          { name: '在线营销服务', nameEn: 'Online Marketing', value: 73000, color: '#2ea043' },
          { name: 'AI 云及其他', nameEn: 'AI Cloud & Others', value: 31100, color: '#3fb950' },
        ],
      },
      {
        name: '爱奇艺',
        nameEn: 'iQIYI',
        value: 29100,
        color: COLORS[1],
        children: [
          { name: '会员服务', nameEn: 'Membership', value: 17500, color: '#d29922' },
          { name: '广告', nameEn: 'Advertising', value: 6800, color: '#e3b341' },
          { name: '内容分销及其他', nameEn: 'Content Distribution & Others', value: 4800, color: '#f2c14e' },
        ],
      },
    ],
  },
  {
    symbol: '9618.HK',
    code: '9618',
    name: '京东集团',
    nameEn: 'JD.com Inc.',
    exchange: 'HKEX',
    sector: 'E-commerce / Logistics',
    financials: {
      revenue: 1158190,
      netIncome: 41359,
      revenueGrowth: 6.8,
      grossMargin: 15.3,
      operatingMargin: 3.8,
      peRatio: 9.4,
      marketCap: 450,
    },
    segments: [
      {
        name: '京东零售',
        nameEn: 'JD Retail',
        value: 1027000,
        color: COLORS[0],
        children: [
          { name: '电子产品及家用电器', nameEn: 'Electronics & Home Appliances', value: 573000, color: '#2ea043' },
          { name: '日用百货', nameEn: 'General Merchandise', value: 358000, color: '#3fb950' },
          { name: '服务收入', nameEn: 'Service Revenue', value: 96000, color: '#56d364' },
        ],
      },
      {
        name: '京东物流',
        nameEn: 'JD Logistics',
        value: 182600,
        color: COLORS[1],
        children: [
          { name: '一体化供应链', nameEn: 'Integrated Supply Chain', value: 91000, color: '#d29922' },
          { name: '其他物流服务', nameEn: 'Other Logistics', value: 91600, color: '#e3b341' },
        ],
      },
      { name: '新业务', nameEn: 'New Initiatives', value: 5000, color: COLORS[2] },
      { name: '抵销及其他', nameEn: 'Eliminations & Others', value: -56410, color: COLORS[5] },
    ],
  },
];

export const findStock = (code: string): HKStock | undefined =>
  HK_STOCKS.find((s) => s.symbol === code || s.code === code);
