// Vercel Serverless Function: POST /api/follow-up-qa
// Proxies Google Gemini API for follow-up questions about the memo

export const config = {
  maxDuration: 60,
};

interface FollowUpQABody {
  question: string;
  memo: string;
  stockCode?: string;
  stockName?: string;
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
    const body: FollowUpQABody = req.body || {};
    if (!body.question || !body.memo) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: '未配置 GEMINI_API_KEY' });
    }

    const isZh = body.language === 'zh';

    const prompt = `${isZh ? '你是一名专业的港股投资分析师，请根据以下备忘录内容，回答用户的问题。' : 'You are a professional HK-stock investment analyst. Answer the user\'s question based on the following memo.'}\n\n` +
      `**Memo Content:**\n${body.memo}\n\n` +
      `${body.stockCode ? `Stock Code: ${body.stockCode}\n` : ''}` +
      `${body.stockName ? `Stock Name: ${body.stockName}\n` : ''}\n` +
      `**User Question:**\n${body.question}\n\n` +
      `${isZh ? '请用简体中文回答，保持专业、简洁、准确。' : 'Please answer in English, keep it professional, concise, and accurate.'}`;

    // Model fallback chain: if the primary model is overloaded (503 / 429),
    // retry on a different model before giving up.
    const MODELS = [
      'gemini-2.5-flash',      // primary — best quality, 250 RPD free
      'gemini-2.0-flash',      // separate quota, very similar quality
      'gemini-flash-latest',   // Google-managed alias, whatever is healthiest
      'gemini-2.5-flash-lite', // last resort — output may truncate
    ];

    const buildUrl = (model: string) =>
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const requestBody = JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 1024,
        thinkingConfig: { thinkingBudget: 0 },
      },
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
        if (r.ok) {
          upstream = r;
          console.log(`Gemini model used for QA: ${model}`);
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

    if (!upstream) {
      return res.status(503).json({
        error: 'Gemini 所有候选模型当前都过载，请稍后重试',
        detail: lastErrText,
      });
    }

    const data = await upstream.json();
    const candidate = data?.candidates?.[0];
    const answer: string = candidate?.content?.parts?.[0]?.text ?? '';
    const finishReason: string | undefined = candidate?.finishReason;

    if (finishReason && finishReason !== 'STOP') {
      console.error(`Gemini finishReason: ${finishReason}`, {
        safetyRatings: candidate?.safetyRatings,
      });
    }

    res.status(200).json({ answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '后端代理异常' });
  }
}
