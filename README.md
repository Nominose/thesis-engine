# ThesisEngine

AI 驱动的港股投资备忘录生成器 —— 输入一只港股代码，几秒内流式生成结构化的 Bull / Bear 分析。

> ENT208TC Industry Readiness · XJTLU · Spring 2026
> Team Expedition 33 · Session D/2 · Group 33

---

## 🎯 产品一句话

散户看到的研报要么只吹要么只黑，要么是泛泛的新闻摘要。ThesisEngine 把**牛市观点和熊市观点等权重并排**呈现，让用户做决策前看清两面。

**Sprint 1 scope**：5 只预缓存港股（腾讯 0700、小米 1810、美团 3690、百度 9888、京东 9618），流式 Bull/Bear 备忘录，部署在 Vercel，中英双语切换。

---

## 🏗️ 架构

```
┌─────────────────┐      ┌──────────────────┐      ┌──────────────┐
│  React + Vite   │ ───▶ │  Vercel /api/*   │ ───▶ │  Gemini API  │
│  (前端 UI)       │      │ (serverless)     │      │  (streaming) │
└─────────────────┘      └──────────────────┘      └──────────────┘
        │                         │
        │                         └─▶ 缓存 JSON（5 只港股）
        │
        └─▶ 浏览器实时渲染流式 memo
```

- **前端**：React 19 + Vite + Tailwind CSS v4 + TypeScript
- **API 层**：Vercel Serverless Functions（Node），代理 Gemini API 解决 CORS + 保护 API key
- **AI**：Google Gemini 2.5 Flash，流式 SSE 响应
- **部署**：Vercel（push 到 main 自动部署，PR 出 Preview URL）
- **数据**：Sprint 1 用静态 JSON，Sprint 2 接真实数据源

**为什么是 Vercel**：浏览器不能直接调 Gemini API（CORS），serverless function 同时解决 (a) CORS 和 (b) 保护 API key 不泄露到浏览器端。

---

## 🚀 快速上手（新成员 5 分钟起服务）

### 前置

- Node.js 18+
- Git
- Vercel 账号（免费）
- 从 @XingyiYao 那里拿到 Vercel 项目的访问权限

### 步骤

```bash
# 1. clone 仓库
git clone <this-repo-url>
cd thesis-engine

# 2. 装依赖
npm install

# 3. 装 Vercel CLI（只需一次）
npm install -g vercel

# 4. 登录 Vercel
vercel login

# 5. 关联到已存在的项目
vercel link
# 按提示选 nominoses-projects → thesisengine

# 6. 拉取环境变量（包括 GEMINI_API_KEY）
vercel env pull .env.local

# 7. 起服务
vercel dev --listen 3000
```

打开 <http://localhost:3000> 即可。前端和 API 都在这个端口上。

### Windows / PowerShell 报"禁止运行脚本"怎么办

PowerShell 默认禁止跑 `.ps1`。两个办法：

- 换用 `cmd`（推荐）
- 或在 PowerShell 里跑 `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

---

## 🔐 环境变量

| 变量 | 说明 | 在哪里配 |
|---|---|---|
| `GEMINI_API_KEY` | Gemini API key，服务端使用，**绝不暴露到浏览器** | Vercel 项目 Settings → Environment Variables |

**永远不要把 `.env.local` 提交到 git**。`.gitignore` 已覆盖 `*.local` 和 `.env`。

新成员不需要自己申请 key —— 用 `vercel env pull` 即可从 Vercel 项目同步下来。

---

## 📂 目录结构

```
thesis-engine/
├── api/
│   └── generate-memo.ts        # Vercel serverless function — Gemini proxy
├── src/
│   ├── components/
│   │   ├── StockCodeSearch.tsx         # 港股搜索（所有者：Zhihao）
│   │   ├── RevenueSegmentBreakdown.tsx # 营收分部拆解（所有者：Zhihao）
│   │   └── MemoGenerator.tsx           # Bull/Bear 流式渲染（所有者：Yuxuan）
│   ├── data/
│   │   └── hk-stocks.ts        # 5 只港股缓存数据 + 财务 + 分部
│   ├── i18n/                   # 中英双语切换
│   │   ├── dictionaries.ts
│   │   └── LanguageContext.tsx
│   ├── App.tsx                 # 页面整体布局
│   └── main.tsx
├── public/
├── vercel.json                 # Vercel 配置
├── vite.config.ts              # 本地 dev 把 /api 代理到 vercel dev
├── .env.local                  # 本地 env（gitignored）
└── package.json
```

---

## 👥 团队与分工

| 角色 | 成员 | 负责 |
| --- | --- | --- |
| PM | Xingyi Yao | 路线图、sprint 计划、跨职能沟通 |
| Tech Lead | Jiapeng Xuan | 架构决策、PRD、技术文档 |
| User Researcher | Chunyu Wang | 用户访谈、需求收敛、验证 |
| Backend | Mingxuan Guo | Vercel API 代理、Gemini 集成 |
| Frontend | Qiqing Wu | React + Vite 脚手架、组件库 |
| Frontend | Yuxuan Wang | 流式 memo 渲染 |
| Frontend | Zhihao Yang | 股票搜索、营收拆解 |
| UI/UX | Yunfei Gao | 视觉规范、UI 稿 (readdy.cc) |

---

## 🔄 开发流程

### 分支

- `main` → 生产分支，push 后 Vercel 自动部署
- 所有修改走 feature 分支 + PR（即使是一个人的改动，也能拿到 Vercel Preview URL）

### 分支命名

| 前缀 | 用途 |
|---|---|
| `feat/xxx` | 新功能 |
| `fix/xxx` | bug 修复 |
| `docs/xxx` | 仅文档 |
| `refactor/xxx` | 代码重构 |
| `chore/xxx` | 工具/依赖/配置 |

### Commit message（Conventional Commits）

```
feat: add stock selector component
fix: handle empty memo response
docs: update setup instructions
chore: bump vite to 5.2
```

### PR 规范

- 标题同 commit message 格式
- 描述写三件事：**改了什么 / 为什么改 / 怎么测试**
- 等 Vercel Preview URL 出现后再 request review
- Sprint 1 允许 self-merge（团队初期求务实）

---

## 🎯 Sprint 1 目标（Weeks 5-6）

Week 6 结束时，任何人打开线上 URL 应该能：

- [x] 从 5 只预缓存港股里选一只
- [x] 看到关键财务数据（营收、净利润、毛利率、P/E、市值、分部营收）
- [x] 点一下就看到流式生成的 Bull / Bear 备忘录
- [x] 可以中英切换

**不在 Sprint 1 范围**：用户登录、PDF 导出、实时行情、股票对比、多轮对话、新闻聚合。任何 PR 带了这些东西都算 scope creep，请进 Sprint 2 backlog。

---

## 📝 脚本

```bash
npm run dev        # 只起前端（localhost:5173），需要另起 vercel dev 才能调 API
npm run build      # 打 prod 包到 dist/
npm run preview    # 预览 prod 打包结果
npm run lint       # 跑 ESLint
```

日常开发用 `vercel dev --listen 3000` 最省事，前端 + API 一站式。

---

## 🐛 Troubleshooting

| 症状 | 原因 | 解决 |
|---|---|---|
| `未配置 GEMINI_API_KEY` | 本地没 env | `vercel env pull .env.local` 再重启 |
| `vercel` 命令找不到 | 没装全局 | `npm install -g vercel` |
| PowerShell 拒绝跑 npm | execution policy 限制 | 用 `cmd` 或改 policy |
| `/api/generate-memo` 404 | vercel dev 没起或端口不对 | 确认 `vercel dev --listen 3000` 在跑 |
| 生成按钮无响应 | F12 打开 DevTools 看 Network 和 Console | 把错误截图发群里 |

---

## 📜 License

MIT（课程项目）

---

## 🙏 致谢

本项目是 XJTLU ENT208TC Industry Readiness 课程作业。感谢 Google Gemini API 提供的免费额度。
