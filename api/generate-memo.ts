// Vercel Serverless Function: POST /api/generate-memo
// Proxies Google Gemini streaming API and re-emits SSE chunks to the browser.

export const config = {
  maxDuration: 60,
};

interface GenerateMemoBody {
  stockCode?: string;
  stockName?: string;
  financialData?: Record<string, unknown>;
  segments?: string[];
  language?: 'en' | 'zh';
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持 POST 请求' });
  }

  try {
    const body: GenerateMemoBody = req.body || {};
    if (!body.stockCode || !body.stockName || !body.financialData) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: '未配置 GEMINI_API_KEY' });
    }

    const isZh = body.language === 'zh';

    // The section headers (**Bull Case**, **Bear Case**, **Key Risk**, **Verdict**)
    // must stay in English so the frontend parser picks them up. The arguments
    // and rationale inside are what should honour the user's language choice.
    const languageInstruction = isZh
      ? '请用简体中文撰写所有论点、风险段落和结论句。但是所有的章节标题必须保持英文原样：**Bull Case**、**Bear Case**、**Key Risk**、**Verdict**。Verdict 后面仍然以 Bull / Bear / Neutral 这三个英文词之一开头。'
      : 'Write every argument, risk paragraph and rationale in English. Keep the section headers exactly as shown.';

    const prompt = `You are a professional HK-stock investment analyst. Output a structured investment memo using the exact Markdown format below.

${languageInstruction}

**Bull Case** (exactly 4 concise arguments, each one line):
-
-
-
-

**Bear Case** (exactly 4 concise arguments, each one line):
-
-
-
-

**Key Risk**:
(one paragraph, <= 60 words)

**Verdict** (one line — start with exactly one of: Bull / Bear / Neutral — followed by a one-sentence rationale):
...

Stock Code: ${body.stockCode}
Stock Name: ${body.stockName}
Financial Data (in millions HKD where applicable):
${JSON.stringify(body.financialData, null, 2)}

Revenue Segments:
${body.segments && body.segments.length ? body.segments.join('\n') : 'No additional segments'}

Output **only** the pure Markdown above. No greetings, no code fences, no extra commentary.`;

    // Model fallback chain: if the primary model is overloaded (503 / 429),
    // retry on a lighter model before giving up. `?alt=sse` makes Gemini emit
    // proper Server-Sent Events instead of a streamed JSON array.
    const MODELS = [
      'gemini-2.5-flash',      // primary — best quality/free-tier balance
      'gemini-2.5-flash-lite', // lighter, usually has spare capacity
      'gemini-flash-latest',   // Google-managed alias, last resort
    ];

    const buildUrl = (model: string) =>
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

    const requestBody = JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
        // No maxOutputTokens — let the model decide when to stop. The memo is
        // short by nature (prompt asks for 4+4 bullets + 1 paragraph + 1 line),
        // and the model will stop at the format boundary on its own.
        // An artificial cap was truncating Chinese memos mid-sentence.
        //
        // 2.5 Flash is a thinking model. Disable its thinking budget so all
        // tokens go toward the user-visible memo instead of internal reasoning.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    let upstream: Response | null = null;
    let lastErrText = '';
    for (const model of MODELS) {
      try {
        const r = await fetch(buildUrl(model), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody,
        });
        if (r.ok && r.body) {
          upstream = r;
          console.log(`Gemini model used: ${model}`);
          break;
        }
        // Only fall through to the next model on transient overload errors.
        // 4xx client errors (bad key, bad request) shouldn't retry.
        lastErrText = await r.text().catch(() => '');
        const isTransient = r.status === 503 || r.status === 429 || r.status === 500;
        console.error(`Gemini ${model} failed:`, r.status, lastErrText.slice(0, 200));
        if (!isTransient) {
          return res.status(502).json({
            error: 'Gemini API 调用失败',
            detail: lastErrText,
          });
        }
      } catch (e) {
        lastErrText = e instanceof Error ? e.message : String(e);
        console.error(`Gemini ${model} threw:`, lastErrText);
      }
    }

    if (!upstream || !upstream.body) {
      return res.status(503).json({
        error: 'Gemini 所有候选模型当前都过载，请稍后重试',
        detail: lastErrText,
      });
    }

    // Switch to SSE mode
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.slice(5).trim();
          if (!dataStr || dataStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(dataStr);
            const text: string =
              parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            if (text) {
              // Re-emit as plain SSE to the browser.
              // Escape any embedded newlines so each chunk stays on one data: line.
              const safe = text.replace(/\r?\n/g, '\\n');
              res.write(`data: ${safe}\n\n`);
              // Preserve actual newlines by emitting a separate chunk per line
              // isn't strictly necessary — the frontend decodes \\n back into \n.
            }
          } catch {
            // Ignore malformed chunks
          }
        }
      }
    } finally {
      res.write('data: [DONE]\n\n');
      res.end();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '后端代理异常' });
  }
}
