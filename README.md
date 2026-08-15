# STOW — 跨裝置剪貼簿原型

這是一個參考 `/home/kaiyasi/Coder/Blog` 與 `/home/kaiyasi/Coder/Website` 視覺語言的前端原型：把剪貼內容、連結、程式碼與記事放在同一個可搜尋的個人檔案卡片裡。內容預設只屬於本人，只有主動建立分享連結後才會開放給其他人。

介面沿用兩個專案的共同元素：Blog 的檔案索引、等寬字與紅／藍重音，以及 Website 的票券框線、巨大標題、卡片切換與明暗主題。

## 開始使用

直接開啟 `index.html` 即可預覽。若要用本機伺服器：

```sh
python3 -m http.server 4174
```

再開啟 <http://localhost:4174>。

## 已完成的互動

- 快速新增剪貼內容／記事；自動辨識連結與程式碼片段
- 搜尋、最近／最早排序、列表／網格檢視
- 複製、釘選、編輯、刪除、標籤與內容預覽
- 使用帳號名稱（nickname）＋密碼登入；註冊時提供 Gmail 作為密碼重設用途，並支援指定帳號的受限分享連結與「持有連結者」公開分享選項
- 未登入時先顯示 STOW 介紹頁，登入後才開放工作區；前端 Demo 會以一年有效期的 cookie 保留登入狀態
- `localStorage` 保存資料，並用 `storage` event 示範多分頁同步
- `/` 搜尋、`N` 新增、`SUPER/Ctrl + Enter` 儲存、`ESC` 關閉視窗
- 行動版側欄與響應式排版

目前是無後端的展示原型；登入、註冊、分享驗證與連結都是前端 Demo Flow，真正的「只有指定一人可看」必須由伺服器端的帳號驗證、資料庫 ACL、一次性 token／session 與撤銷機制強制執行。跨裝置同步還需要同步 API／WebSocket，以及桌面或手機端的明確剪貼簿權限。瀏覽器本身不允許網站在背景無限制讀取系統剪貼簿。

## 素材

- `assets/editorial-paper-bg.png`：以 `imagegen` 生成的低對比紙張／墨跡背景
- `assets/ambient-room.webp`：取自 Website 專案的環境背景，用低透明度作為介面氛圍層
- `assets/favicon.svg`：以 SVG 製作的 STOW favicon，避免小尺寸失真
