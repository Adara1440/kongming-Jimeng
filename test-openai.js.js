import OpenAI from "openai";
const client = new OpenAI({
  apiKey: "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" // ← 放你現在可用的金鑰
});

const main = async () => {
  console.log("Testing gpt-4o...");
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o", // ← 關鍵！改這裡，不要用 gpt-4o-mini
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "請簡短回答：你現在能正常運作嗎？" }
      ],
    });

    console.log("✅ 成功回應：", completion.choices[0].message.content);
  } catch (err) {
    console.error("❌ 失敗：", err.message);
  }
};

main();
