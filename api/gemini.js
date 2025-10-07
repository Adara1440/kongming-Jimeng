import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export default async function handler(req, res) {
  try {
    const { news } = req.body;
    const { type } = req.query;

    if (!news) return res.status(400).json({ success: false, error: "缺少新聞內容" });

    // 🧩 若是單項請求
    if (type) {
      let prompt = "";
      if (type === "script") {
        prompt = `請以孔明（諸葛亮）風格，將以下新聞改寫成60秒內短影音旁白腳本。必須包含：開頭吸睛、新聞重點、結尾收斂。用第一人稱孔明語氣。
新聞內容：${news}`;
      } else if (type === "scene") {
        prompt = `根據以下孔明風格腳本內容，生成4個即夢AI組圖提示，角色保持一致，細節描述具象化，融合戰略與未來科技風格：
${news}`;
      } else {
        prompt = `根據以下場景提示，為每個場景生成即夢視頻動作指令，描述鏡頭、角度、動作，符合短影片調性：
${news}`;
      }
      const result = await model.generateContent(prompt);
      return res.json({ success: true, result: result.response.text() });
    }

    // 🧠 一鍵生成模式
    const scriptPrompt = `以孔明（諸葛亮）風格撰寫新聞短影音腳本，要求：
- 精煉傳達新聞重點
- 用第一人稱孔明語氣與比喻
新聞內容：${news}`;
    const script = (await model.generateContent(scriptPrompt)).response.text();

    const scenePrompt = `根據以下腳本，生成即夢AI組圖提示，設計4個統一風格場景：
${script}`;
    const scene = (await model.generateContent(scenePrompt)).response.text();

    const videoPrompt = `根據以下即夢組圖內容，生成對應的視頻鏡頭動作指令（例如：拉近、環繞、俯拍、特寫）：
${scene}`;
    const video = (await model.generateContent(videoPrompt)).response.text();

    res.json({ success: true, result: { script, scene, video } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}
