// 提示詞模板
const PROMPTS = {
  script: (news) => `你是一位專業的新聞影片腳本編輯，請將以下新聞改寫成「孔明說新聞」風格的短影音旁白稿。

要求：
1. 保持客觀中立，但語氣要有節奏感
2. 適合 60 秒以內的短影音
3. 使用口語化表達，避免書面語
4. 開頭要有吸引力，結尾要有總結
5. 字數控制在 150-200 字

新聞內容：
${news}

請直接輸出旁白稿，不要加任何標題或說明。`,

  scene: (news) => `你是一位 AI 圖像生成專家，請根據以下新聞內容，生成 3-5 組「即夢 AI」圖像生成提示詞。

要求：
1. 每組提示詞要對應新聞的關鍵場景
2. 使用英文描述（即夢 AI 英文效果較好）
3. 格式：Scene 1: [描述], Scene 2: [描述]...
4. 描述要具體、視覺化，包含：主體、動作、背景、光線、風格
5. 適合新聞報導風格的畫面

新聞內容：
${news}

請直接輸出場景提示詞，每個場景一行。`,

  video: (news) => `你是一位影片剪輯指導，請根據以下新聞內容，生成「即夢 AI 視頻生成」的分鏡指令。

要求：
1. 生成 3-5 個分鏡動作指令
2. 格式：鏡頭 1: [動作描述] (3秒), 鏡頭 2: [動作描述] (4秒)...
3. 包含：鏡頭運動（推/拉/搖/移）、轉場效果
4. 總時長控制在 60 秒內
5. 適合即夢 AI 和剪映的視頻生成邏輯

新聞內容：
${news}

請直接輸出分鏡指令，每個鏡頭一行。`
};

// 調用 OpenAI API（使用原生 fetch，不需要額外套件）
async function callOpenAI(apiKey, prompt) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o",  // 使用你測試成功的模型
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500  // 增加 token 上限，確保完整輸出
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
    throw new Error(error.error?.message || `OpenAI API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

module.exports = async function handler(req, res) {
  try {
    // 只允許 POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    // 環境變數驗證
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("❌ OPENAI_API_KEY missing");
      return res.status(500).json({ 
        success: false,
        error: "Missing OPENAI_API_KEY. Please set it in Vercel Environment Variables." 
      });
    }

    // 驗證 content type 與 body
    if (!req.headers["content-type"]?.includes("application/json")) {
      console.error("❌ Invalid content type:", req.headers["content-type"]);
      return res.status(400).json({ 
        success: false,
        error: "Content-Type must be application/json" 
      });
    }

    // 解析請求資料
    let newsContent, requestType;
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      newsContent = body.news;
      requestType = req.query.type || "all";
    } catch (e) {
      console.error("❌ Invalid JSON body:", e);
      return res.status(400).json({ 
        success: false,
        error: "Invalid JSON body" 
      });
    }

    if (!newsContent || newsContent.trim() === "") {
      console.error("❌ Empty news content received");
      return res.status(400).json({ 
        success: false,
        error: "News content is required" 
      });
    }

    console.log(`🤖 OpenAI (gpt-4o) generating type: ${requestType}`);
    console.log(`📝 News length: ${newsContent.length} chars`);

    // 根據 type 生成不同內容
    if (requestType === "all") {
      // 一鍵生成三種內容
      console.log("📦 Generating all content types...");
      
      const [script, scene, video] = await Promise.all([
        callOpenAI(apiKey, PROMPTS.script(newsContent)),
        callOpenAI(apiKey, PROMPTS.scene(newsContent)),
        callOpenAI(apiKey, PROMPTS.video(newsContent))
      ]);

      console.log("✅ All content generated successfully");
      return res.status(200).json({
        success: true,
        result: { script, scene, video }
      });
    } else {
      // 單獨生成某一類型
      const prompt = PROMPTS[requestType];
      if (!prompt) {
        return res.status(400).json({ 
          success: false,
          error: `Invalid type: ${requestType}. Use 'all', 'script', 'scene', or 'video'` 
        });
      }

      console.log(`📝 Generating ${requestType}...`);
      const text = await callOpenAI(apiKey, prompt(newsContent));

      console.log(`✅ ${requestType} generated successfully`);
      return res.status(200).json({
        success: true,
        result: text
      });
    }
  } catch (err) {
    console.error("💥 OpenAI API error:", err);
    
    // 提供更詳細的錯誤訊息
    let errorMessage = err.message || "Internal Server Error";
    
    if (err.message?.includes("API key")) {
      errorMessage = "OpenAI API Key 無效，請檢查環境變數設定";
    } else if (err.message?.includes("quota") || err.message?.includes("insufficient_quota")) {
      errorMessage = "API 配額已用盡，請檢查 OpenAI 帳戶餘額";
    } else if (err.message?.includes("rate_limit")) {
      errorMessage = "請求過於頻繁，請稍後再試";
    } else if (err.message?.includes("context_length_exceeded")) {
      errorMessage = "新聞內容過長，請縮短後再試";
    }
    
    return res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};