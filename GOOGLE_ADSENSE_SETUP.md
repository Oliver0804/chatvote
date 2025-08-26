# Google AdSense 設定說明

## 目前狀態
- Publisher ID: ca-pub-5218895047629495 ✅
- 廣告容器已添加到所有頁面 ✅
- 實際廣告位 ID: 1960969761 ✅
- Google AdSense 代碼已更新到所有頁面 ✅
- 廣告正式啟用 🎉

## 設定步驟

### 1. 獲取廣告位 ID
1. 登入 [Google AdSense 控制台](https://www.google.com/adsense/)
2. 前往「廣告」→「概覽」→「按廣告單元」
3. 點擊「+」創建新廣告單元
4. 選擇「多媒體廣告」→「回應式」
5. 設定廣告單元名稱（如：ChatVote-Header-Banner）
6. 複製生成的廣告位 ID

### 2. 更新代碼
將所有頁面中的廣告佔位符替換為實際 AdSense 代碼：

```html
<div class="ad-container">
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5218895047629495"
            crossorigin="anonymous"></script>
    <ins class="adsbygoogle"
         style="display:block"
         data-ad-client="ca-pub-5218895047629495"
         data-ad-slot="您的實際廣告位ID"
         data-ad-format="auto"
         data-full-width-responsive="true"></ins>
    <script>
        (adsbygoogle = window.adsbygoogle || []).push({});
    </script>
</div>
```

### 3. 需要更新的檔案
- [x] public/index.html
- [x] public/polls.html  
- [x] public/history.html
- [x] public/vote.html
- [x] public/result.html
- [x] public/user.html

## 廣告政策提醒
1. 確保網站內容符合 AdSense 政策
2. 避免點擊自己的廣告
3. 廣告不應影響用戶體驗
4. 保持合理的廣告密度

## 測試建議
1. 部署到生產環境後測試廣告顯示
2. 使用不同裝置確認響應式效果
3. 檢查廣告是否會影響頁面功能
4. 監控廣告收益和點擊率

## 備註
- 廣告可能需要幾小時到幾天才會開始顯示
- 新網站可能需要 AdSense 審核批准
- 建議先用測試廣告確認功能正常

## 常見問題 (Troubleshooting)

### 廣告不顯示的可能原因：

1. **網站未通過 AdSense 審核**
   - 新網站需要先通過 Google AdSense 審核
   - 審核期間可能需要數天到數週

2. **廣告屏蔽器**
   - 用戶可能安裝了廣告屏蔽擴展
   - 測試時請關閉 AdBlock 等擴展

3. **地理位置限制**
   - AdSense 在某些地區可能沒有廣告庫存
   - 不同地區的廣告顯示率不同

4. **網站內容政策**
   - 確保網站內容符合 AdSense 政策
   - 避免暴力、成人或危險內容

5. **流量門檻**
   - 新網站可能需要累積一定流量才會顯示廣告
   - 建議增加有價值的內容和用戶互動

### 測試方法：
1. 使用不同瀏覽器測試（無廣告屏蔽器）
2. 檢查瀏覽器開發者工具的控制台錯誤
3. 確認廣告代碼沒有 JavaScript 錯誤
4. 等待 24-48 小時後再次檢查

### 當前狀態：
- 代碼已正確部署 ✅
- 等待 Google 廣告審核和投放 ⏳