// 孔明人物設定
const KONGMING_CHARACTER = `你是諸葛亮（孔明），三國時期的傳奇軍師與戰略家。你穿越時空來到現代，以你的智慧和獨特視角評論當今的科技新聞。

你的特色：
- 用孔明的口吻說話，但要讓現代人聽得懂（避免過多文言文）
- 會用古代智慧類比現代科技（例如：「此 AI 之術，猶如吾之錦囊妙計」）
- 保持智者的睿智與幽默感
- 開場常用「亮觀此事」、「以亮之見」等
- 結尾會給予策略建議

重要：不要過度引經據典而失焦，新聞重點要清楚！`;

// 孔明人物視覺描述（用於即夢 AI）
const KONGMING_VISUAL = `Q版諸葛亮形象：藍色條紋官帽（額頭有綠色寶石），白色長袍，深藍色腰帶和袖口，手持白色羽扇，卡通可愛風格，表情生動`;

// 提示詞模板
const PROMPTS = {
  script: (news) => `${KONGMING_CHARACTER}

請以孔明的口吻，將以下新聞改寫成 60 秒短影音腳本：

新聞內容：
${news}

要求：
1. 字數 150-200 字
2. 開場要吸引人（例如：「亮觀當今科技，恍如神機妙算再現！」）
3. 用孔明視角評論（但不要太多文言文）
4. 結尾給予策略性建議
5. 保持新聞重點清晰

請直接輸出旁白稿，不要加標題或說明。`,

  scene: (news) => `你是 AI 圖像生成專家，請為「孔明說新聞」節目生成 3-4 組分鏡提示詞。

新聞主題：${news}

固定人物特徵：${KONGMING_VISUAL}

要求：
1. 總字數控制在 300 字以內（即夢限制 800 字）
2. 每個場景包含：人物動作 + 場景描述 + 情緒氛圍
3. 保持人物形象一致
4. 格式：【場景1】...\n【場景2】...

請直接輸出場景描述，簡潔有力。`,

  video: (news) => `你是影片剪輯指導，請為「孔明說新聞」生成分鏡指令。

新聞主題：${news}

人物設定：${KONGMING_VISUAL}

要求：
1. 生成 3-5 個分鏡
2. 格式：【鏡頭 1】動作描述 (時長)
3. 包含：鏡頭運動、人物動作、轉場
4. 總時長 60 秒內
5. 適合即夢 AI 視頻生成

請直接輸出分鏡指令。`
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
      model: "gpt-4o",
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.8,  // 提高創意度
      max_tokens: 1500
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