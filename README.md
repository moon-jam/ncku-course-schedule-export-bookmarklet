# 匯出成大課表成 ICS 的 Bookmarklet

把成大課表直接匯出成 `.ics`，可匯入 Google 日曆、Apple 日曆、Outlook。

在課表頁按下書籤後，會跳出一個儀表板，讓你設定每門課要重複幾週、要跳過哪些日期，再下載 ICS。

https://github.com/user-attachments/assets/a415c6d8-65f6-4867-b846-3ce7004444f0

## 功能

- 自動解析課表，將同一天連續節次的同一門課合併成單一事件（間隔小於 20 分鐘視為連續）。
- 每門課的標題可直接編輯，編輯後的文字就是行事曆事件名稱。
- 每門課可獨立設定重複週數。
- 跳過日期：可設定特定需跳過日期清單套用所有課（考慮到國定假日），個別課程還可再加自己的跳過日期（ICS 的 `EXDATE`）。
- 可選的每週日週數提醒：勾選後，每個週日會有一筆全天事件，標題為「成功大學第 N 週」（預設不勾選）。
- 時區固定 `Asia/Taipei`。
- 時間未定或彈性時間課程（含彈性密集）僅在儀表板列出。

## 安裝

線上版：<https://ncku-course2ics.moon-jam.me/>，把「課表匯出 ICS」按鈕拖到書籤列即可。

書籤本身只是一段 loader，按下後會去載線上版的 `app.js`。所以之後功能更新，你不必重新加入書籤，重新整理後就是最新版。

本機建置：

1. `npm install`（安裝 esbuild）。
2. `npm run build`，用 esbuild 把 `src/` 打包成 `dist/app.js`，並產生 `index.html`、`bookmarklet.txt`、`CNAME`、示範圖。
3. 用瀏覽器開 `dist/index.html`，把「課表匯出 ICS」按鈕拖到書籤列。

## 使用

1. 登入成大課程系統，開啟「我的課表」頁面：<https://course.ncku.edu.tw/index.php?c=cos32315>
2. 點書籤列的「課表匯出 ICS」。
3. 在儀表板：
   - 選「開學日（第一週的週一）」當重複的錨點。
   - 設定預設重複週數，或逐門課調整。
   - 填入要跳過的日期（一行一個或以空白分隔，格式 `YYYY-MM-DD`）。
4. 按「下載 ICS」取得 `ncku-schedule.ics`，再匯入你的行事曆。

## LICENSE

[MIT License](LICENSE)

