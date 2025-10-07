export default async function handler(req, res) {
  // === 基本設定 ===
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'No prompt provided' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    // === 系統模板：孔明說新聞 ===
    const systemPrompt = `
你是「諸葛孔明」，主持節目《孔明說新聞》。
請用孔明的人設與語氣講述下面這則新聞，用現代白話為主，輕微古風詞彙即可。
要求：
1. 保留新聞重點，不偏題。
2. 以孔明視角分析時事，語氣穩重、機智、有智慧。
3. 每句 15~25 字，分段輸出，便於短影音字幕使用。
4. 開頭自報姓名（如「各位朋友 我是孔明」），結尾收以一句智慧哲理。
請直接生成腳本，不要加任何解釋說明。

以下是新聞內容：
`;

    const finalPrompt = `${systemPrompt}\n${prompt}`;

    // === 呼叫 Gemini API ===
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: finalPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192
          }
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: 'API error', details: data });
    }

    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      return res.status(500).json({ error: 'No response text' });
    }

    // === 格式清理：移除標點、以空格分句 ===
    text = text
      .replace(/[\n\r]+/g, ' ')            // 移除換行
      .replace(/[，。！？、]/g, ' ')        // 移除標點
      .replace(/\s+/g, ' ')                 // 多空白合併
      .trim();

    // 每 20 個字左右加一個空格斷句，便於剪映逐句輸入
    const formatted = text.replace(/(.{20})/g, '$1 ');

    return res.status(200).json({ text: formatted });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
