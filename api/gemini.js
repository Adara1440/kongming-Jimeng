import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 🧠 核心提示：請求同時生成三種內容（腳本＋組圖＋影片）
    const fullPrompt = `
你是一位新聞短影音製作導演，根據以下新聞內容：
「${prompt}」

請依下列格式依序輸出：
【1】孔明說新聞短影音腳本：
（生成簡潔、有節奏感的旁白稿，語氣像是聰明又風趣的軍師孔明）

【2】即夢AI組圖提示詞：
（生成4~6段畫面構想，格式為：主題＋視覺風格＋鏡頭構圖＋氛圍描述，以供AI繪圖使用）

【3】即夢AI影片生成指令：
（為每張組圖分別產生動態化指令，例如：鏡頭移動、人物動作、轉場效果）

請確保輸出順序與標題完全一致，不要加入額外說明。
    `;

    const result = await model.generateContent(fullPrompt);
    const output = result.response.text();

    res.status(200).json({ text: output });
  } catch (error) {
    console.error("❌ Gemini API 錯誤：", error);
    res.status(500).json({ error: error.message });
  }
}
