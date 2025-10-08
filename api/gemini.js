const { GoogleGenerativeAI } = require("@google/generative-ai");

// 提示詞模板
const PROMPTS = {
  script: (news) => `
你是一位專業的新聞影片腳本編輯，請將以下新聞改寫成「孔明說新聞」風格的短影音旁白稿。

要求：
1. 保持客觀中立，但語氣要有節奏感
2. 適合 60 秒以內的短影音
3. 使用口語化表達，避免書面語
4. 開頭要有吸引力，結尾要有總結
5. 字數控制在 150-200 字

新聞內容：
${news}

請直接輸出旁白稿，不要加任何標題或說明。
`,

  scene: (news) => `
你是一位 AI 圖像生成專家，請根據以下新聞內容，生成 3-5 組「即夢 AI」圖像生成提示詞。

要求：
1. 每組提示詞要對應新聞的關鍵場景
2. 使用英文描述（即夢 AI 英文效果較好）
3. 格式：Scene 1: [描述], Scene 2: [描述]...
4. 描述要具體、視覺化，包含：主體、動作、背景、光線、風格
5. 適合新聞報導風格的畫面

新聞內容：
${news}

請直接輸出場景提示詞，每個場景一行。
`,

  video: (news) => `
你是一位影片剪輯指導，請根據以下新聞內容，生成「即夢 AI 視頻生成」的分鏡指令。

要求：
1. 生成 3-5 個分鏡動作指令
2. 格式：鏡頭 1: [動作描述] (3秒), 鏡頭 2: [動作描述] (4秒)...
3. 包含：鏡頭運動（推/拉/搖/移）、轉場效果
4. 總時長控制在 60 秒內
5. 適合即夢 AI 和剪映的視頻生成邏輯

新聞內容：
${news}

請直接輸出分鏡指令，每個鏡頭一行。
`
};

module.exports = async function handler(req, res) {
  try {
    // 只允許 POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    // 環境變數驗證
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("❌ GEMINI_API_KEY missing");
      return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
    }

    // 驗證 content type 與 body
    if (!req.headers["content-type"]?.includes("application/json")) {
      console.error("❌ Invalid content type:", req.headers["content-type"]);
      return res.status(400).json({ error: "Content-Type must be application/json" });
    }

    // 解析請求資料
    let newsContent, requestType;
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      newsContent = body.news;
      requestType = req.query.type || "all"; // 從 URL query 取得 type
    } catch (e) {
      console.error("❌ Invalid JSON body:", e);
      return res.status(400).json({ error: "Invalid JSON body" });
    }

    if (!newsContent || newsContent.trim() === "") {
      console.error("❌ Empty news content received");
      return res.status(400).json({ error: "News content is required" });
    }

    console.log(`🧠 Gemini generating type: ${requestType}`);

    // 初始化 Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 根據 type 生成不同內容
    if (requestType === "all") {
      // 一鍵生成三種內容
      console.log("📦 Generating all content types...");
      
      const [scriptResult, sceneResult, videoResult] = await Promise.all([
        model.generateContent(PROMPTS.script(newsContent)),
        model.generateContent(PROMPTS.scene(newsContent)),
        model.generateContent(PROMPTS.video(newsContent))
      ]);

      const script = scriptResult?.response?.text?.() || "生成失敗";
      const scene = sceneResult?.response?.text?.() || "生成失敗";
      const video = videoResult?.response?.text?.() || "生成失敗";

      console.log("✅ All content generated successfully");
      return res.status(200).json({
        success: true,
        result: { script, scene, video }
      });
    } else {
      // 單獨生成某一類型
      const prompt = PROMPTS[requestType];
      if (!prompt) {
        return res.status(400).json({ error: `Invalid type: ${requestType}` });
      }

      console.log(`📝 Generating ${requestType}...`);
      const result = await model.generateContent(prompt(newsContent));
      const text = result?.response?.text?.();

      if (!text) {
        console.error("⚠️ Gemini returned empty response");
        return res.status(502).json({ error: "Gemini returned empty response" });
      }

      console.log(`✅ ${requestType} generated successfully`);
      return res.status(200).json({
        success: true,
        result: text
      });
    }
  } catch (err) {
    console.error("💥 Gemini API error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal Server Error"
    });
  }
};