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
        // Explicitly set to the model's maximum. Leaving this unset relied on
        // a Gemini default that was sometimes lower than expected, causing
        // mid-memo truncation. 65536 is 2.5 Flash's hard ceiling.
        maxOutputTokens: 65536,
        // Disable thinking — its tokens share the output budget and we don't
        // need chain-of-thought for a structured Markdown memo.
        thinkingConfig: { thinkingBudget: 0 },
      },
      // Financial commentary can nudge the default safety thresholds and
      // cause premature termination with finishReason: SAFETY. Relax the
      // thresholds to the most permissive free-tier level (BLOCK_ONLY_HIGH)
      // so balanced Bull/Bear analysis isn't blocked mid-stream.
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      ],
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

    // Process a batch of SSE lines (data: {...}) and re-emit `text` chunks to
    // the browser. Extracted so we can call it both inside the read loop AND
    // once more after the loop ends to flush any trailing bytes.
    const processLines = (lines: string[]) => {
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.slice(5).trim();
        if (!dataStr || dataStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(dataStr);
          const candidate = parsed?.candidates?.[0];
          const text: string = candidate?.content?.parts?.[0]?.text ?? '';
          const finishReason: string | undefined = candidate?.finishReason;

          if (text) {
            // Escape embedded newlines so each chunk stays on one `data:` line.
            // Frontend decodes \\n back into \n on receive.
            const safe = text.replace(/\r?\n/g, '\\n');
            res.write(`data: ${safe}\n\n`);
          }

          // If Gemini stopped for any reason other than a normal STOP, surface
          // it to the logs so we can diagnose truncations. SAFETY / MAX_TOKENS
          // / RECITATION are the usual suspects.
          if (finishReason && finishReason !== 'STOP') {
            console.error(`Gemini finishReason: ${finishReason}`, {
              safetyRatings: candidate?.safetyRatings,
            });
          }
        } catch {
          // Ignore malformed chunks
        }
      }
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        processLines(lines);
      }

      // Flush any remaining bytes. If Gemini sent the last event without a
      // trailing newline (observed in practice — caused the last few chars
      // of the Verdict to be dropped), its content was still sitting in
      // `buffer` when the stream ended. Drain the decoder then process.
      buffer += decoder.decode();
      if (buffer.length > 0) {
        processLines([buffer]);
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
