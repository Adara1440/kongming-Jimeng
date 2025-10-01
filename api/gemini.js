export default async function handler(req, res) {
  // 設定 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只允許 POST 請求' });
  }

  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: '請提供 prompt' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: '未設置 GEMINI_API_KEY' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,  // 增加到 2048
          },
        })
      }
    );

    // 先檢查回應是否成功
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 錯誤:', errorText);
      return res.status(response.status).json({ 
        error: 'Gemini API 錯誤',
        details: errorText
      });
    }

    // 嘗試解析 JSON
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('JSON 解析錯誤:', parseError);
      const text = await response.text();
      return res.status(500).json({ 
        error: 'JSON 解析失敗',
        raw: text.substring(0, 200) // 只返回前200個字符
      });
    }

    // 檢查回應格式
    if (!data.candidates || data.candidates.length === 0) {
      return res.status(500).json({ 
        error: '無效的回應格式',
        data: data
      });
    }

    // 檢查是否有文字內容
    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
      return res.status(500).json({ 
        error: '回應中無內容',
        candidate: candidate
      });
    }

    const text = candidate.content.parts[0].text;
    if (!text) {
      return res.status(500).json({ 
        error: '回應文字為空'
      });
    }

    return res.status(200).json({ 
      text: text
    });

  } catch (error) {
    console.error('伺服器錯誤:', error);
    return res.status(500).json({ 
      error: '內部伺服器錯誤',
      message: error.message
    });
  }
}
