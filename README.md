# 靈感收集器

這是一個使用 Remix、React 與 [Base UI](https://base-ui.com/) 建立的個人靈感收集工具，可部署到 GitHub Pages。

**開箱就能用，不用做任何設定。** 每次新增、編輯或刪除後，資料都會立即寫入 IndexedDB，並同步保留 localStorage 備援。重新整理、關閉瀏覽器或從 iPhone 主畫面重開都不會清空。

## 專案內容

- `app/packages/inspiration/`：收藏介面、Base UI 元件與持久化邏輯
- `app/routes/`：Remix 路由
- `public/`：PWA manifest、Service Worker 與圖示
- `vercel.json`：Vercel 部署設定

## 資料存在哪裡

1. IndexedDB 是主要儲存，適合保存連結、分類與壓縮後的縮圖。
2. localStorage 同步保留最新快照；IndexedDB 失效時仍能還原。
3. 舊版 `inspo:cache` 會在第一次啟動時自動搬移，不會因改版遺失。
4. 右上角資料面板可下載或匯入 JSON 備份。

## 本機開發

```sh
npm install
npm run dev
```

## Vercel 部署

專案以網站根目錄 `/` 提供服務。Vercel 會依 `vercel.json` 執行 `npm run build`，並發布 `build/client`；SPA 路由由 rewrite 全部導回 `index.html`。

## iPhone 加到主畫面

1. 用 iPhone Safari 開啟你的 Vercel 網址。
2. 點底部分享按鈕。
3. 選「加入主畫面」。
4. 直接開始貼網址，不用先設定任何東西。

## 注意

- 只有手動清除這個網站的瀏覽器資料時，收藏才會被刪除。
- 建議定期下載 JSON 備份，方便換裝置時匯入。
