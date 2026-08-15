# STOW — 跨裝置剪貼簿

這是一個參考 `/home/kaiyasi/Coder/Blog` 與 `/home/kaiyasi/Coder/Website` 視覺語言的跨裝置剪貼簿：把剪貼內容、連結、程式碼與記事放在同一個可搜尋的個人檔案卡片裡。內容預設只屬於本人，只有主動建立分享連結後才會開放給其他人。

介面沿用兩個專案的共同元素：Blog 的檔案索引、等寬字與紅／藍重音，以及 Website 的票券框線、巨大標題、卡片切換與明暗主題。

## 開始使用

正式互動需要 Node.js 與 PostgreSQL。先安裝依賴並設定環境變數：

```sh
cp .env.example .env
npm install
npm start
```

`DATABASE_URL` 或 `POSTGRES_*` 必須指向可用的 PostgreSQL。正式環境另外設定 `APP_BASE_URL`、`SMTP_URL` 與 `SMTP_FROM`，忘記密碼才會寄出一次性重設連結。

若只想看靜態畫面，可以直接開啟 `index.html`；但靜態預覽不會提供登入、內容保存或跨裝置同步。

## 已完成的互動

- 快速新增剪貼內容／記事；自動辨識連結與程式碼片段
- 搜尋、最近／最早排序、列表／網格檢視
- 複製、釘選、編輯、刪除、標籤與內容預覽
- 使用帳號名稱（nickname）＋至少 12 字元密碼登入；密碼以 bcrypt 雜湊保存，登入使用伺服器端 Session
- Session Cookie 為一年有效期、`HttpOnly`、`SameSite=Lax`，正式 HTTPS 會加上 `Secure`
- 未登入時先顯示 STOW 介紹頁，登入後才開放工作區；內容保存於 PostgreSQL，不進入 `localStorage`
- Gmail 忘記密碼流程使用一次性、限時 Token；寄信服務由 SMTP 環境變數配置
- 指定帳號與持有連結者分享都由伺服器端 ACL 驗證，分享網址使用不可預測 Token，並提供撤銷 API
- API 使用參數化 SQL、CSRF Token、Helmet 安全標頭、JSON 大小限制與登入限流
- `/` 搜尋、`N` 新增、`SUPER/Ctrl + Enter` 儲存、`ESC` 關閉視窗
- 行動版側欄與響應式排版

目前同步按鈕會重新從 API 讀取 PostgreSQL；若要做到即時推送，可再接 WebSocket。瀏覽器本身仍不允許網站在背景無限制讀取系統剪貼簿，使用者需要透過貼上動作或瀏覽器明確授權。

## 目錄分工

- `server/`：與平台無關的 Express API、帳號、Session、內容與分享權限
- `index.html`、`styles.css`、`app.js`：前端介面
- `paster-gitlab-ops/`：只放 GitLab 上傳操作，不存放憑證
- `paster-gitlab-staging/`：GitLab 平台模板與部署組裝目錄，不回寫原始碼

## 素材

- `assets/editorial-paper-bg.png`：以 `imagegen` 生成的低對比紙張／墨跡背景
- `assets/ambient-room.webp`：取自 Website 專案的環境背景，用低透明度作為介面氛圍層
- `assets/favicon.svg`：以 SVG 製作的 STOW favicon，避免小尺寸失真
