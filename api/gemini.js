// 孔明人物設定
const KONGMING_CHARACTER = `你是諸葛亮（孔明），三國時期的傳奇軍師與戰略家。你穿越時空來到現代，以你的智慧和獨特視角評論當今的科技新聞。

你的特色：
- 用孔明的口吻說話，但要讓現代人聽得懂（7 分白話 + 3 分文雅）
- 靈活運用你的各種智慧和歷史經驗（不要每次都講草船借箭或空城計）
- 根據新聞主題選擇適合的類比：
  * AI 技術 → 可比擬奇門遁甲、陣法推演
  * 商業競爭 → 可比擬三分天下、聯吳抗曹
  * 創新突破 → 可比擬木牛流馬、連弩改良
  * 數據分析 → 可比擬觀星象、知天文
- 保持智者的睿智與幽默感
- 開場要吸引人，不要每次都用固定句式
- 結尾給予實用的策略建議

重要：新聞重點要清楚，不要為了賣弄而失焦！`;

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
2. 開場要有新意（避免重複使用「亮觀此事」）
3. 用孔明視角評論，選擇適合此新聞的歷史智慧類比
4. 語言要生動有趣，讓現代人愛聽
5. 結尾給予實用建議
6. 保持新聞重點清晰

請直接輸出旁白稿，不要加標題或說明。`,

  scene: (news) => `你是 AI 圖像生成專家，請為「孔明說新聞」節目生成 4 組分鏡提示詞。

新聞主題：${news}

固定人物特徵：${KONGMING_VISUAL}

重要指示：
請根據參考圖的人物特徵和服飾，生成四個分鏡畫面。人物為諸葛亮（孔明），保持藍色條紋官帽、白色長袍、手持羽扇的形象特徵一致。

要求：
1. 必須生成恰好 4 組場景
2. 每組控制在 60-80 字
3. 每個場景包含：人物動作 + 場景描述 + 情緒氛圍
4. 用英文描述（即夢 AI 英文效果較好）
5. 格式範例：
   Scene 1: Kongming in blue striped hat with green gem, white robe, holding feather fan, standing in...

請直接輸出 4 個場景，每個場景開頭標註 Scene 1/2/3/4。`,

  video: (news) => `你是影片剪輯指導，請為「孔明說新聞」生成 4 組獨立的視頻生成指令。

新聞主題：${news}

人物設定：${KONGMING_VISUAL}

重要：即夢視頻有 500 字限制，且需要分別上傳組圖、分別製作，所以請生成 4 個獨立的視頻指令。

要求：
1. 必須生成恰好 4 組指令，每組獨立可用
2. 每組控制在 100-120 字
3. 格式：
   【視頻 1】鏡頭描述 + 動作 + 時長 + 轉場
   【視頻 2】...
4. 每個視頻時長 10-15 秒
5. 包含鏡頭運動（推/拉/搖/移）
6. 適合即夢 AI 視頻生成邏輯

請直接輸出 4 組視頻指令，每組獨立成段。`
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
      console.error("❌ Invalid content type:", req.headers["content-type"]);
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

    console.log(`🤖 Generating type: ${requestType}`);

    if (requestType === "all") {
      console.log("📦 Generating all content types...");
      
      const [scriptRaw, sceneRaw, videoRaw] = await Promise.all([
        callOpenAI(apiKey, PROMPTS.script(newsContent)),
        callOpenAI(apiKey, PROMPTS.scene(newsContent)),
        callOpenAI(apiKey, PROMPTS.video(newsContent))
      ]);

      // 在組圖提示詞前加上警告
      const scene = `⚠️ 使用前請先上傳參考圖（孔明人物）

請根據參考圖的人物特徵和服飾，生成四個分鏡畫面。人物為諸葛亮（孔明），保持藍色條紋官帽、白色長袍、手持羽扇的形象特徵一致。

${sceneRaw}`;

      console.log("✅ All content generated");
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

      console.log(`📝 Generating ${requestType}...`);
      let text = await callOpenAI(apiKey, prompt(newsContent));

      // 如果是 scene 類型，加上警告
      if (requestType === "scene") {
        text = `⚠️ 使用前請先上傳參考圖（孔明人物）

請根據參考圖的人物特徵和服飾，生成四個分鏡畫面。人物為諸葛亮（孔明），保持藍色條紋官帽、白色長袍、手持羽扇的形象特徵一致。

${text}`;
      }

      console.log(`✅ ${requestType} generated`);
      return res.status(200).json({
        success: true,
        result: text
      });
    }
  } catch (err) {
    console.error("💥 API error:", err);
    
    let errorMessage = err.message || "Internal Server Error";
    
    if (err.message?.includes("API key")) {
      errorMessage = "API Key 無效";
    } else if (err.message?.includes("quota") || err.message?.includes("insufficient_quota")) {
      errorMessage = "API 配額已用盡";
    } else if (err.message?.includes("rate_limit")) {
      errorMessage = "請求過於頻繁，請稍後再試";
    }
    
    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
};