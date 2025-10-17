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
- 結尾：實用建議或警示`;

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
        
2.【說新聞 20秒】白話講清楚事件
   - 用白話文清楚交代：誰做了什麼、結果如何
   - 具體數據和事實
   
3.【戰略分析 20秒】用策略觀點解讀
   - 從戰略角度分析（如：虛實之計、資訊戰、心理戰）
   
4.【收尾 15秒】實用建議或警示

請直接輸出旁白稿，語氣要生動有變化。`,

  scene: (news, hasNewsImage) => {
    const imageInstruction = hasNewsImage ? 
    `【重要】場景必須融入新聞圖片：
    - 場景2：螢幕/投影必須顯示「新聞核心畫面」（會參考上傳的圖片）
    - 場景3：展示「新聞相關數據或圖表」（融入新聞視覺元素）
    - 使用「螢幕顯示」「投影展示」「平板呈現」等詞彙
    - 明確描述圖片內容，如「AI生成的假照片」「TikTok影片截圖」等` :
    `【注意】沒有提供新聞圖片，請根據新聞內容自行設計視覺元素：
    - 場景2：想像並描述新聞的關鍵視覺畫面
    - 場景3：設計相關的數據圖表或示意圖
    - 要具體描述假想的畫面內容`;

    return `你是專業的分鏡師，請為「孔明說新聞」生成 4 個超具體的視覺場景。

新聞內容：${news}

${imageInstruction}

【重要規則】
- 場景描述只需要純視覺畫面，不要有任何文字、標題、字幕
- 避免出現文字看板、標語、螢幕文字（除非是模糊背景）
- 重點在人物動作、環境氛圍、視覺構圖
- 如需展示數據，用「圖表」「曲線」「視覺化圖形」而非文字

場景設計原則：
1. 孔明在【現代場景】評論新聞（不是古代場景）
2. 每個場景 50-70 字，超級具體
3. 必須能看出這是什麼新聞（要有辨識度）
4. 純視覺描述，避免任何需要後製修改的文字元素

必須包含的結構：
【場景1】開場：孔明發現新聞的驚訝反應，現代新聞室/戰情室
【場景2】展示：大螢幕/投影顯示新聞核心畫面或圖片（純畫面無文字）
【場景3】分析：孔明在數據圖表前解說，用視覺化圖形呈現
【場景4】結論：孔明對鏡頭給建議，背景呼應新聞主題

請生成4個場景：`;
  },

  video: (news) => `為已生成的 4 個場景圖設計對應的視頻運鏡指令。

新聞：${news}

要求：
1. 每個指令 60-80 字
2. 基於場景圖的已有元素設計運鏡
3. 運鏡類型：推進/拉遠/橫移/環繞
4. 每段 10-15 秒
5. 不要提及任何文字或字幕元素

請輸出 4 個視頻運鏡指令，格式為【視頻N】描述：`,

  refineScene: (currentScenes, userRequest, news, hasNewsImage) => {
    const imageNote = hasNewsImage ? 
      '用戶有提供新聞圖片，必須在場景2和場景3中融入' : 
      '用戶沒有提供新聞圖片，請根據新聞內容自行設計視覺元素';
    
    return `你是場景優化專家。

原始新聞：${news}

目前的場景描述：
${currentScenes}

用戶要求調整：
${userRequest}

${imageNote}

【重要規則】
- 場景描述只需要純視覺畫面，不要有任何文字、標題、字幕
- 避免出現文字看板、標語、螢幕文字
- 重點在人物動作、環境氛圍、視覺構圖
- 如需展示數據，用「圖表」「曲線」「視覺化圖形」而非文字

請根據用戶要求重新生成優化後的4個場景。保持原有風格但融入用戶的調整要求。
如果用戶提到特定場景號碼，重點調整該場景。
確保場景2和場景3有明確的視覺元素描述。

輸出格式：【場景N】描述`;
  }
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
    // 檢查是否為 refine 請求
    const isRefineRequest = req.query.type === 'refine';
    
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

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    
    // 處理場景優化請求
    if (isRefineRequest) {
      const { currentScenes, userRequest, originalNews, hasNewsImage, regenerateVideo } = body;

      if (!currentScenes || !userRequest || !originalNews) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields for refine"
        });
      }

      // 生成優化後的場景
      const refinedScenes = await callOpenAI(
        apiKey, 
        PROMPTS.refineScene(currentScenes, userRequest, originalNews, hasNewsImage)
      );

      // 加上操作提示
      const sceneTips = hasNewsImage ? 
        `💡 即夢AI操作提示：
1. 上傳孔明參考圖作為「角色參考」
2. 上傳新聞圖片作為「場景參考」
3. 生成參數：16:9橫版、3D插畫風格
4. 避免生成文字元素

` : 
        `💡 即夢AI操作提示：
1. 上傳孔明參考圖作為「角色參考」
2. 生成參數：16:9橫版、3D插畫風格
3. 避免生成文字元素

`;

      const result = {
        success: true,
        scenes: sceneTips + refinedScenes
      };

      // 如果需要同步更新視頻運鏡
      if (regenerateVideo) {
        const newVideo = await callOpenAI(apiKey, PROMPTS.video(originalNews));
        result.video = newVideo;
      }

      return res.status(200).json(result);
    }

    // 原有的生成邏輯
    const newsContent = body.news;
    const requestType = req.query.type || "all";
    const hasNewsImage = body.hasNewsImage || false;

    if (!newsContent || newsContent.trim() === "") {
      return res.status(400).json({ 
        success: false,
        error: "News content is required" 
      });
    }

    console.log(`Generating: ${requestType}, Has image: ${hasNewsImage}`);

    if (requestType === "all") {
      const [scriptRaw, sceneRaw, videoRaw] = await Promise.all([
        callOpenAI(apiKey, PROMPTS.script(newsContent)),
        callOpenAI(apiKey, PROMPTS.scene(newsContent, hasNewsImage)),
        callOpenAI(apiKey, PROMPTS.video(newsContent))
      ]);

      const sceneTips = hasNewsImage ? 
        `💡 即夢AI操作提示：
1. 上傳孔明參考圖作為「角色參考」
2. 上傳新聞圖片作為「場景參考」（場景2、3會自動融入）
3. 生成參數：16:9橫版、3D插畫風格
4. 場景設計已避免文字元素

` : 
        `💡 即夢AI操作提示：
1. 上傳孔明參考圖作為「角色參考」
2. 生成參數：16:9橫版、3D插畫風格
3. AI已根據新聞內容設計視覺元素
4. 場景設計已避免文字元素

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

      const promptText = requestType === "scene" ? 
        prompt(newsContent, hasNewsImage) : 
        prompt(newsContent);
        
      let text = await callOpenAI(apiKey, promptText);

      if (requestType === "scene") {
        const sceneTips = hasNewsImage ?
          `💡 即夢AI操作提示：
1. 上傳孔明參考圖作為「角色參考」
2. 上傳新聞圖片作為「場景參考」
3. 生成參數：16:9橫版、3D插畫風格
4. 場景設計已避免文字元素

` :
          `💡 即夢AI操作提示：
1. 上傳孔明參考圖作為「角色參考」
2. 生成參數：16:9橫版、3D插畫風格
3. 場景設計已避免文字元素

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
