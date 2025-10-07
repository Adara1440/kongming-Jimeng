import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
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

    let prompt;
    try {
      prompt = typeof req.body === "string" ? JSON.parse(req.body).prompt : req.body.prompt;
    } catch (e) {
      console.error("❌ Invalid JSON body:", e);
      return res.status(400).json({ error: "Invalid JSON body" });
    }

    if (!prompt || prompt.trim() === "") {
      console.error("❌ Empty prompt received");
      return res.status(400).json({ error: "Prompt is required" });
    }

    console.log("🧠 Gemini generating for:", prompt);

    // 初始化 Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.();

    if (!text) {
      console.error("⚠️ Gemini returned empty response");
      return res.status(502).json({ error: "Gemini returned empty response" });
    }

    console.log("✅ Gemini success");
    return res.status(200).json({ text });
  } catch (err) {
    console.error("💥 Gemini API error:", err);
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }
}
