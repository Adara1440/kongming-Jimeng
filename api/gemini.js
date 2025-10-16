// 孔明人物設定 - 改版：戰略科技評論員
const KONGMING_CHARACTER = `你是諸葛亮（孔明），三國時期的傳奇軍師，現在是現代科技新聞評論員。

重要原則：
1. 用【80%白話文 + 20%古風點綴】（僅在開場、轉折、結尾稍微點綴）
2. 必須清楚說明新聞的5W1H（誰、什麼、何時、何地、為何、如何）
3. 用「戰略思維」分析科技現象，避免歷史典故
4. 語氣要有起伏變化：驚訝→說明→分析→警示
5. 你是在「說新聞」不是「講道理」

你的說話風格：
- 開場：吸引注意，帶情緒（驚訝/震驚/好奇）
- 說新聞：白話、清晰、具體
- 分析：用戰略角度解讀（資訊戰、心理戰、布局等）
- 結尾：實用建議或警示

禁止事項：
- 不要編造歷史
- 不要過度說教
- 不要模糊新聞重點`;

// 提示詞模板 - 全面改版
const PROMPTS = {
  script: (news) => `${KONGMING_CHARACTER}

請以孔明的口吻，將以下新聞改寫成 60 秒短影音腳本：

新聞內容：
${news}

腳本結構（150-200字）：
1.【開場 5秒】吸引注意
   範例：「諸位！孔明剛看到一則離譜新聞——」
        「嘖嘖嘖，這○○公司真是出奇招了——」
        「各位看官，今天的AI江湖又起風雲——」
        
2.【說新聞 20秒】白話講清楚事件
   - 用白話文清楚交代：誰做了什麼、結果如何
   - 具體數據和事實
   - 不要文言文

3.【戰略分析 20秒】用策略觀點解讀
   - 從戰略角度分析（如：虛實之計、資訊戰、心理戰）
   - 點出背後的趨勢或問題
   
4.【收尾 15秒】實用建議或警示
   - 給觀眾具體建議
   - 或提出值得思考的問題

請直接輸出旁白稿，語氣要生動有變化。`,

  scene: (news) => `你是專業的分鏡師，請為「孔明說新聞」生成 4 個超具體的視覺場景。

新聞內容：${news}

場景設計原則：
1. 孔明在【現代場景】評論新聞（不是古代場景）
2. 場景2或3要能【融入新聞相關圖片/畫面】
3. 每個場景 50-70 字，超級具體
4. 要有視覺張力和故事性

場景結構建議：
【場景1】開場：孔明在現代戰情室/新聞台發現消息
【場景2】展示：螢幕/投影顯示新聞畫面（可融入新聞圖）
【場景3】分析：孔明在數據圖表/戰略地圖前解說
【場景4】結論：孔明面對鏡頭給出建議

融入新聞圖片的方式：
- 「螢幕上顯示著[新聞核心畫面]」
- 「背後投影幕展示[相關圖片內容]」
- 「手中平板顯示[新聞截圖]」
- 「電視牆播放[事件現場]」

請為新聞生成 4 個場景，格式為【場景N】描述：`,

  video: (news) => `為已生成的 4 個場景圖設計對應的視頻運鏡指令。

新聞：${news}

要求：
1. 每個指令 60-80 字（即夢視頻限制）
2. 必須基於場景圖的已有元素設計運鏡
3. 運鏡類型：推進/拉遠/橫移/環繞/俯拍
4. 每段 10-15 秒
5. 有節奏變化（快慢結合）

請輸出 4 個視頻運鏡指令，格式為【視頻N】描述：`
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
      console.error("OPENAI_API_KEY missing");
      return res.status(500).json({ 
        success: false,
        error: "Missing OPENAI_API_KEY" 
      });
    }

    if (!req.headers["content-type"]?.includes("application/json")) {
      console.error("Invalid content type");
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
      console.error("Invalid JSON body");
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

    console.log(`Generating: ${requestType}`);

    if (requestType === "all") {
      const [scriptRaw, sceneRaw, videoRaw] = await Promise.all([
        callOpenAI(apiKey, PROMPTS.script(newsContent)),
        callOpenAI(apiKey, PROMPTS.scene(newsContent)),
        callOpenAI(apiKey, PROMPTS.video(newsContent))
      ]);

      // 組圖前加上提示
      const sceneTips = `💡 即夢AI操作提示：
1. 上傳孔明參考圖作為「角色參考」
2. 如有新聞圖片，上傳作為「場景參考」
3. 生成參數建議：16:9橫版、3D插畫風格

`;

      return res.status(200).json({
        success: true,
        result: { 
          script: scriptRaw, 
          scene: sceneTips + sceneRaw, 
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
        const sceneTips = `💡 即夢AI操作提示：
1. 上傳孔明參考圖作為「角色參考」
2. 如有新聞圖片，上傳作為「場景參考」
3. 生成參數建議：16:9橫版、3D插畫風格

`;
        text = sceneTips + text;
      }

      return res.status(200).json({
        success: true,
        result: text
      });
    }
  } catch (err) {
    console.error("API error:", err);
    
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
