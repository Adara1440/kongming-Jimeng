<!-- 在生成按鈕前加入 -->
<div class="mb-4">
  <label class="flex items-center">
    <input type="checkbox" id="hasNewsImage" class="mr-2">
    <span>我有新聞相關圖片要融入場景</span>
  </label>
</div>

<script>
// 修改 generateContent 函數
async function generateContent() {
  const newsContent = document.getElementById('newsInput').value.trim();
  const hasNewsImage = document.getElementById('hasNewsImage').checked;
  
  // ... 其他代碼保持不變
  
  const response = await fetch('/api/gemini?type=all', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ 
      news: newsContent,
      hasNewsImage: hasNewsImage  // 傳遞是否有新聞圖片
    })
  });
}
</script>
```

## 📊 **改進效果預期**

使用同一則AI惡作劇新聞，新版本會產生：

### **腳本範例**：
```
「諸位！孔明剛看到一則離譜新聞——

美國青少年現在玩起AI惡作劇，用AI生成假流浪漢照片，
騙父母說讓陌生人進家門，把家長嚇到直接報警！
這個『AI街友惡作劇』在TikTok爆紅，影片破百萬觀看。

從戰略角度看，這是典型的『虛實之計』——
當假訊息太逼真，連親人都被騙倒，
這已不只是惡作劇，而是資訊戰的預演！

諸位，當AI讓造假零成本，
我們該如何分辨真假？
記住：科技可載舟，亦可覆舟啊！」
```

### **場景描述**：
```
【場景1】孔明站在現代新聞監控室，面對弧形電視牆...
【場景2】大螢幕顯示AI生成的流浪漢照片，紅色警告標誌...
