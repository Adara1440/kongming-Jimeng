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
  
  // 調試：檢查 API Key
  if (!apiKey) {
    console.error('GEMINI_API_KEY 未設定');
    return res.status(500).json({ 
      error: '未設置 GEMINI_API_KEY',
      debug: '環境變數未找到'
    });
  }

  console.log('API Key 長度:', apiKey.length);

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
            maxOutputTokens: 1024,
          },
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API 錯誤:', data);
      return res.status(response.status).json({ 
        error: 'Gemini API 錯誤', 
        details: data,
        status: response.status
      });
    }

    // 檢查回應格式
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('回應格式錯誤:', data);
      return res.status(500).json({ 
        error: '回應格式錯誤',
        data: data
      });
    }

    return res.status(200).json({ 
      text: data.candidates[0].content.parts[0].text 
    });

  } catch (error) {
    console.error('詳細錯誤:', error);
    return res.status(500).json({ 
      error: '內部伺服器錯誤',
      message: error.message,
      stack: error.stack
    });
  }
}
