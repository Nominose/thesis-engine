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

    // Using gemini-2.5-flash — stable, free tier is generous (~10 RPM / 250 RPD),
    // fast, 1M context. `?alt=sse` makes Gemini emit proper Server-Sent Events
    // instead of a streamed JSON array.
    const GEMINI_URL =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse';

    const upstream = await fetch(`${GEMINI_URL}&key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => '');
      console.error('Gemini error:', upstream.status, errText);
      return res.status(502).json({ error: 'Gemini API 调用失败', detail: errText });
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
