import OpenAI from "openai";
const client = new OpenAI({
  apiKey: "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", // ← 一定用英數，不要加任何中文註解或全形符號
});

const main = async () => {
  try {
    const models = await client.models.list();
    const names = models.data.map((m) => m.id).sort();
    console.log("可用模型：");
    console.log(names.filter((n) => n.includes("gpt")));
  } catch (error) {
    console.error("發生錯誤：", error);
  }
};

main();
