# 靈感收集器

這是一個可以放在 GitHub Pages 的個人靈感收集工具。前端是靜態網頁，資料寫到你自己的 Google Sheet，縮圖存到你指定的 Google Drive 資料夾。

## 專案內容

- `index.html`：手機與桌面可用的前端
- `manifest.webmanifest`、`sw.js`、`icons/`：讓 iPhone 可以用 Safari 加到主畫面
- `backend/Code.gs`：Google Apps Script 後端，負責讀寫 Sheet 與 Drive 縮圖

## 1. 建立 Google Sheet 後端

1. 建立一份新的 Google Sheet。
2. 在 Google Drive 建立一個用來存縮圖的資料夾。
3. 複製該資料夾網址中 `/folders/` 後面的資料夾 ID。
4. 在 Google Sheet 點「擴充功能」→「Apps Script」。
5. 用 `backend/Code.gs` 的內容取代預設程式碼。
6. 修改 `Code.gs` 頂部兩個值：
   - `TOKEN`：換成你自己設定的一串私密文字。
   - `FOLDER_ID`：換成你的 Drive 縮圖資料夾 ID。
7. 在 Apps Script 上方選單選 `setup` 並執行一次，完成授權。
8. 點「部署」→「新增部署作業」→ 類型選「網頁應用程式」。
9. 設定「執行身分：我自己」，「誰可以存取：所有人」，然後部署。
10. 複製部署網址，網址應該以 `/exec` 結尾。

## 2. 放到 GitHub 使用

1. 在 GitHub 建立一個新的 repository。
2. 把本資料夾所有檔案推上去。
3. 到 repository 的 `Settings` → `Pages`。
4. Source 選 `Deploy from a branch`。
5. Branch 選 `main`，資料夾選 `/root`，儲存。
6. GitHub Pages 產生網址後，用 Safari 開啟。

## 3. iPhone 加到主畫面

1. 用 iPhone Safari 開啟你的 GitHub Pages 網址。
2. 點底部分享按鈕。
3. 選「加入主畫面」。
4. 第一次打開時，到工具右上角資料設定，貼上 Apps Script `/exec` 網址與 `TOKEN`。

設定會存在該台裝置的瀏覽器 localStorage，不會被提交到 GitHub。

## 注意

- 不建議把你真正的 `TOKEN` 提交到公開 GitHub。
- `backend/Code.gs` 是範本。部署到你自己的 Apps Script 前，才填入真正的 `TOKEN` 和 `FOLDER_ID`。
- GitHub Pages 只能放前端，不能取代 Apps Script 後端。
