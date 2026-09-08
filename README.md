# 靈感收集器

這是一個可以放在 GitHub Pages 的個人靈感收集工具。前端是靜態網頁。

**開箱就能用，不用做任何設定。** 靈感存在你這台裝置的瀏覽器裡（localStorage），關掉重開都還在，縮圖也直接存在本機。

下面的 Google Sheet 設定是**選用**的，只有想跨裝置同步、或想多一份雲端備份時才需要。

## 專案內容

- `index.html`：手機與桌面可用的前端
- `manifest.webmanifest`、`sw.js`、`icons/`：讓 iPhone 可以用 Safari 加到主畫面
- `backend/Code.gs`：選用的 Google Apps Script 後端，負責讀寫 Sheet 與 Drive 縮圖

## 資料存在哪裡

| 模式 | 資料位置 | 需要設定 |
| --- | --- | --- |
| 預設（本機） | 這台裝置的瀏覽器 localStorage | 不用 |
| 接上 Google Sheet | 本機 + 你的 Google Sheet 和 Drive | 要，見下方 |

本機模式下，清掉瀏覽器資料或移除主畫面圖示，靈感會一起消失。建議偶爾到右上角「資料」下載一份 JSON 備份，換手機時用「從 JSON 匯入」還原。

## 選用：建立 Google Sheet 後端

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

設定好之後，在工具右上角「資料」點「接上 Google Sheet（選用）」，貼上 `/exec` 網址與 `TOKEN`。如果 Sheet 是空的，本機已有的靈感會自動上傳上去。想改回只存本機，同一個面板點「中斷同步」，靈感會留在裝置上。

## 放到 GitHub 使用

1. 在 GitHub 建立一個新的 repository。
2. 把本資料夾所有檔案推上去。
3. 到 repository 的 `Settings` → `Pages`。
4. Source 選 `Deploy from a branch`。
5. Branch 選 `main`，資料夾選 `/root`，儲存。
6. GitHub Pages 產生網址後，用 Safari 開啟。

## iPhone 加到主畫面

1. 用 iPhone Safari 開啟你的 GitHub Pages 網址。
2. 點底部分享按鈕。
3. 選「加入主畫面」。
4. 直接開始貼網址，不用先設定任何東西。

## 注意

- 本機模式的靈感和縮圖都存在瀏覽器 localStorage，容量大約 5MB。縮圖太多時工具會提示空間已滿，這時候可以移除幾張縮圖，或接上 Google Sheet 把縮圖改放 Drive。
- 不建議把你真正的 `TOKEN` 提交到公開 GitHub。
- `backend/Code.gs` 是範本。部署到你自己的 Apps Script 前，才填入真正的 `TOKEN` 和 `FOLDER_ID`。
- GitHub Pages 只能放前端，不能取代 Apps Script 後端。
