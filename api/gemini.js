// 孔明人物設定
const KONGMING_CHARACTER = `你是諸葛亮（孔明），三國時期的傳奇軍師與戰略家。你穿越時空來到現代，以你的智慧和獨特視角評論當今的科技新聞。

你的特色：
- 用孔明的口吻說話（智者、謀略家的睿智語氣）
- 7 分白話 + 3 分文雅，讓現代人容易理解
- 不要編造或扭曲歷史事件！如果要引用歷史，必須100%準確
- 優先用「策略思維」而非具體歷史典故
- 例如：
  * 好的做法：「觀此趨勢，當料敵機先，布局長遠」（策略思維）
  * 避免：「此事如當年草船借箭」（具體典故，除非完全適用）
- 開場要有新意，避免重複
- 結尾給予實用建議

重要原則：
1. 新聞重點要清楚，不要為了賣弄而失焦
2. 如果不確定歷史準確性，就不要引用，改用策略思維表達
3. 保持孔明「智者」的人設，但不必每次都講歷史故事`;

// 提示詞模板
const PROMPTS = {
  script: (news) => `${KONGMING_CHARACTER}

請以孔明的口吻，將以下新聞改寫成 60 秒短影音腳本：

新聞內容：
${news}

要求：
1. 字數 150-200 字
2. 開場要有新意（避免重複使用「亮觀此事」）
3. 用孔明視角評論，選擇適合此新聞的歷史智慧類比
4. 語言要生動有趣，讓現代人愛聽
5. 結尾給予實用建議
6. 保持新聞重點清晰

請直接輸出旁白稿，不要加標題或說明。`,

  scene: (news) => `為新聞生成 4 個極簡圖像提示詞（中文）。

新聞：${news}

規則：
1. 每個場景只寫 8-12 字
2. 格式：場景1: 孔明+動作
3. 只寫動作，不寫背景細節
4. 不寫服飾（已有參考圖）

範例：
場景1: 孔明站立揮扇
場景2: 孔明坐姿思考
場景3: 孔明指點講解
場景4: 孔明微笑點頭

直接輸出 4 行：`,

  video: (news) => `為新聞生成 4 個獨立的即夢視頻指令（每個獨立使用）。

新聞：${news}

要求：
1. 每個指令 80-100 字
2. 格式：【視頻1】鏡頭 + 動作 + 時長
3. 包含：推拉搖移、轉場
4. 每段 10-15 秒

請輸出 4 個獨立視頻指令：`
};

// 調用 OpenAI API
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
      temperature: 0.8,
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
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("❌ OPENAI_API_KEY missing");
      return res.status(500).json({ 
        success: false,
        error: "Missing OPENAI_API_KEY" 
      });
    }

    if (!req.headers["content-type"]?.includes("application/json")) {
      console.error("❌ Invalid content type");
      return res.status(400).json({ 
        success: false,
        error: "Content-Type must be application/json" 
      });
    }

    let newsContent, requestType;
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      newsContent = body.news;
      requestType = req.query.type || "all";
    } catch (e) {
      console.error("❌ Invalid JSON body");
      return res.status(400).json({ 
        success: false,
        error: "Invalid JSON body" 
      });
    }

    if (!newsContent || newsContent.trim() === "") {
      return res.status(400).json({ 
        success: false,
        error: "News content is required" 
      });
    }

    console.log(`🤖 Generating: ${requestType}`);

    if (requestType === "all") {
      const [scriptRaw, sceneRaw, videoRaw] = await Promise.all([
        callOpenAI(apiKey, PROMPTS.script(newsContent)),
        callOpenAI(apiKey, PROMPTS.scene(newsContent)),
        callOpenAI(apiKey, PROMPTS.video(newsContent))
      ]);

      // 組圖前加上簡短提示
      const scene = `⚠️ 請先上傳孔明參考圖

${sceneRaw}

註：每個場景單獨上傳參考圖並輸入對應提示詞`;

      return res.status(200).json({
        success: true,
        result: { 
          script: scriptRaw, 
          scene: scene, 
          video: videoRaw 
        }
      });
    } else {
      const prompt = PROMPTS[requestType];
      if (!prompt) {
        return res.status(400).json({ 
          success: false,
          error: `Invalid type: ${requestType}` 
        });
      }

      let text = await callOpenAI(apiKey, prompt(newsContent));

      if (requestType === "scene") {
        text = `⚠️ 請先上傳孔明參考圖

${text}`;
      }

      return res.status(200).json({
        success: true,
        result: text
      });
    }
  } catch (err) {
    console.error("💥 API error:", err);
    
    let errorMessage = err.message || "生成失敗";
    
    if (err.message?.includes("API key")) {
      errorMessage = "API Key 無效";
    } else if (err.message?.includes("quota")) {
      errorMessage = "API 配額已用盡";
    } else if (err.message?.includes("rate_limit")) {
      errorMessage = "請求過於頻繁";
    }
    
    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
};