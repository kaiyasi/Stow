const API_ROOT = "/api";
let csrfToken = "";
let csrfPromise = null;
let passwordResetToken = "";

class StowApiError extends Error {
  constructor(status, data = {}) {
    super(data.message || "STOW 要求失敗");
    this.name = "StowApiError";
    this.status = status;
    this.code = data.code || "SERVER_ERROR";
    this.data = data;
  }
}

async function loadCsrfToken() {
  if (csrfPromise) return csrfPromise;
  csrfPromise = (async () => {
    const response = await fetch(`${API_ROOT}/csrf`, { credentials: "same-origin", headers: { Accept: "application/json" } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.csrfToken) throw new StowApiError(response.status, data);
    csrfToken = data.csrfToken;
    return csrfToken;
  })();
  try {
    return await csrfPromise;
  } finally {
    csrfPromise = null;
  }
}

async function api(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  if (!csrfToken && !["GET", "HEAD", "OPTIONS"].includes(method)) await loadCsrfToken();
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  let body = options.body;
  if (body !== undefined && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }
  if (csrfToken && !["GET", "HEAD", "OPTIONS"].includes(method)) headers.set("X-CSRF-Token", csrfToken);
  const response = await fetch(`${API_ROOT}${path}`, { ...options, method, headers, body, credentials: "same-origin" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new StowApiError(response.status, data);
  return data;
}

const seedItems = [
  {
    id: "seed-1",
    type: "note",
    title: "本週工作節奏",
    content: "先做可以讓事情往前走的事，再整理那些看起來很急的事。\n\n— 週一早上給自己的提醒",
    tags: ["reflection", "work"],
    device: "MacBook Pro",
    timeLabel: "剛剛",
    updatedAt: Date.now() - 7 * 60 * 1000,
    pinned: true,
    collection: "work",
  },
  {
    id: "seed-2",
    type: "code",
    title: "常用的 Git 分支流程",
    content: "git switch main\ngit pull --rebase\ngit switch -c feature/your-idea",
    tags: ["dev", "terminal"],
    device: "MacBook Pro",
    timeLabel: "12 分鐘前",
    updatedAt: Date.now() - 12 * 60 * 1000,
    pinned: true,
    collection: "work",
  },
  {
    id: "seed-3",
    type: "link",
    title: "一篇想慢慢讀的文章",
    content: "https://www.are.na/are-na-editorial/notes-on-attention",
    tags: ["read later", "attention"],
    device: "iPhone 15 Pro",
    timeLabel: "28 分鐘前",
    updatedAt: Date.now() - 28 * 60 * 1000,
    pinned: false,
    collection: "read-later",
  },
  {
    id: "seed-4",
    type: "clip",
    title: "寄送地址格式",
    content: "台北市大安區和平東路三段 1 號 4 樓\n收件人：Kei Yang\n電話：09xx-xxx-xxx",
    tags: ["生活", "address"],
    device: "iPhone 15 Pro",
    timeLabel: "1 小時前",
    updatedAt: Date.now() - 60 * 60 * 1000,
    pinned: true,
    collection: "personal",
  },
  {
    id: "seed-5",
    type: "note",
    title: "產品想法：更安靜的首頁",
    content: "首頁不需要一直提醒使用者「還有什麼沒完成」。\n\n可以改成：一個今天最想留住的東西、一個快速入口，和一點點同步狀態。剩下的交給搜尋。",
    tags: ["product", "ideas"],
    device: "iPad Air",
    timeLabel: "昨天",
    updatedAt: Date.now() - 22 * 60 * 60 * 1000,
    pinned: false,
    collection: "work",
  },
  {
    id: "seed-6",
    type: "clip",
    title: "搭配這組顏色看看",
    content: "#26383B  深墨綠\n#C97962  陶土橘\n#F4F0E8  舊紙白\n#8C80A8  霧紫",
    tags: ["palette", "design"],
    device: "MacBook Pro",
    timeLabel: "昨天",
    updatedAt: Date.now() - 26 * 60 * 60 * 1000,
    pinned: false,
    collection: "work",
  },
  {
    id: "seed-7",
    type: "link",
    title: "Typography in UI Design",
    content: "https://type-scale.com/\n給下個介面做字級階梯時參考。",
    tags: ["design", "reference"],
    device: "Windows PC",
    timeLabel: "8 月 14 日",
    updatedAt: Date.now() - 34 * 60 * 60 * 1000,
    pinned: false,
    collection: "read-later",
  },
  {
    id: "seed-8",
    type: "note",
    title: "週末買菜清單",
    content: "番茄、雞蛋、酸種麵包\n無糖豆漿、羅勒、洗衣精",
    tags: ["weekend", "生活"],
    device: "iPhone 15 Pro",
    timeLabel: "8 月 13 日",
    updatedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    pinned: false,
    collection: "personal",
  },
  {
    id: "seed-9",
    type: "code",
    title: "快速建立一個 debounce",
    content: "const debounce = (fn, delay = 300) => {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delay);\n  };\n};",
    tags: ["javascript", "snippet"],
    device: "Windows PC",
    timeLabel: "8 月 12 日",
    updatedAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
    pinned: false,
    collection: "work",
  },
  {
    id: "seed-10",
    type: "clip",
    title: "下次旅行想去的地方",
    content: "海邊小鎮、早起市場、可以寫一整個下午的咖啡店。\n不要排太滿，留一點走錯路的時間。",
    tags: ["travel", "inspiration"],
    device: "iPad Air",
    timeLabel: "8 月 11 日",
    updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    pinned: false,
    collection: "personal",
  },
];

const state = {
  items: [],
  filter: "all",
  query: "",
  visible: 6,
  selectedId: null,
  captureMode: "clip",
  editingId: null,
  gridView: false,
  sort: "recent",
  authenticated: false,
  authHandle: "",
  authGmail: "",
  pendingShareId: null,
  shareItemId: null,
  shareToken: null,
  sharedItem: null,
  shareAccess: "recipient",
  legalReturnToAuth: false,
  legalRead: { terms: false, privacy: false },
};

const legalDocuments = {
  terms: {
    kicker: "TERMS OF SERVICE / 01",
    title: "服務條款",
    intro: "STOW 是一個用來保存個人文字、連結、程式碼與記事的跨裝置工具。使用 STOW 前，請先了解以下使用規則。",
    sections: [
      ["01 / 服務內容", "STOW 提供內容保存、搜尋、跨裝置同步與分享連結功能。帳號資料與內容會由服務端依帳號保存，服務可依實際部署狀態調整儲存與同步能力。"],
      ["02 / 你的內容", "你保留自己上傳內容的權利，也需要確保自己有權保存與分享這些內容。請不要上傳違法、侵害他人權利、或你沒有權限保存的機密資料。"],
      ["03 / 分享連結", "內容預設只對本人可見。當你建立指定對象連結時，只有通過指定帳號驗證的人可以讀取；當你選擇持有連結者模式時，任何取得連結的人都可能查看內容。你可以在正式版本中隨時撤銷分享連結。"],
      ["04 / 帳號與安全", "請保護帳號名稱與密碼，不要把登入資訊交給他人。註冊時提供的 Gmail 只用於密碼重設；若發現帳號遭到未授權使用，請盡快聯絡 STOW 管理者。"],
      ["05 / 服務變更", "STOW 可能因維護、更新或安全原因調整服務。正式版本會在重大變更前提供通知；展示版不保證資料永久保存或全年無休可用。"],
      ["06 / 刪除與終止", "你可以要求刪除帳號或內容。若內容違反法律或本條款，STOW 得暫停相關帳號或移除內容。正式版的刪除、備份與保存期限會在服務上線前明確說明。"],
    ],
  },
  privacy: {
    kicker: "PRIVACY POLICY / 02",
    title: "隱私政策",
    intro: "我們希望你知道 STOW 會收集什麼、為什麼需要它，以及分享內容時資料會如何流動。這是一份產品草案，正式上線前會再經過法律審閱。",
    sections: [
      ["01 / 我們可能收集的資料", "包含帳號名稱、註冊時提供的 Gmail、你保存的內容與標籤、裝置名稱、同步時間，以及為了維護服務所需的基本技術紀錄。內容會保存於服務端資料庫，不以瀏覽器 localStorage 作為帳號或內容的正式儲存。"],
      ["02 / 使用目的", "資料會用來提供登入、跨裝置同步、內容搜尋、備份、安全防護、分享連結與密碼重設功能。我們不會為了廣告目的讀取你的剪貼簿內容。"],
      ["03 / 分享時會發生什麼", "只有你主動建立分享連結後，內容才會提供給其他人。指定對象模式會綁定收件者帳號；公開連結模式則代表取得連結的人可以查看。"],
      ["04 / 保存與刪除", "正式服務會提供內容匯出、刪除分享連結與刪除帳號的方式。刪除後的備份資料可能因安全與系統週期短暫保留，確切期限會在正式政策中說明。"],
      ["05 / 資料安全", "我們會使用 HTTPS、密碼雜湊、HttpOnly Session、CSRF 驗證、限流與伺服器端權限檢查降低未授權存取風險；但任何網路服務都不能保證絕對不會發生安全事件。"],
      ["06 / 聯絡與更新", "若你對資料使用、刪除或分享權限有疑問，可以透過服務提供的聯絡方式提出要求。政策更新時，會在此文件標示新的更新日期。"],
    ],
  },
};

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);
}

function icon(name) {
  return `<svg aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
}

function typeMeta(type) {
  return {
    clip: { label: "CLIP", icon: "copy", className: "" },
    note: { label: "NOTE", icon: "note", className: "note" },
    link: { label: "LINK", icon: "link", className: "link" },
    code: { label: "CODE", icon: "code", className: "code" },
  }[type] || { label: "CLIP", icon: "copy", className: "" };
}

function inferType(content) {
  const text = content.trim();
  if (/^(https?:\/\/|www\.)/i.test(text)) return "link";
  if (/^(git |npm |const |let |function |import |export |SELECT |<\/?[a-z])/im.test(text) || /[{};]\s*$/m.test(text)) return "code";
  return "clip";
}

function getFilteredItems() {
  const query = state.query.trim().toLowerCase();
  let items = [...state.items];

  if (state.filter === "notes") items = items.filter((item) => item.type === "note");
  if (state.filter === "clips") items = items.filter((item) => item.type !== "note");
  if (state.filter === "pinned") items = items.filter((item) => item.pinned);
  if (["work", "personal", "read-later"].includes(state.filter)) items = items.filter((item) => item.collection === state.filter);
  if (state.filter === "recent") items = items.filter((item) => Date.now() - Number(item.updatedAt) < 48 * 60 * 60 * 1000);

  if (query) {
    items = items.filter((item) => [item.title, item.content, ...(item.tags || []), item.device].join(" ").toLowerCase().includes(query));
  }

  items.sort((a, b) => state.sort === "recent" ? Number(b.updatedAt) - Number(a.updatedAt) : Number(a.updatedAt) - Number(b.updatedAt));
  return items;
}

function countFor(filter) {
  if (filter === "all") return state.items.length;
  if (filter === "notes") return state.items.filter((item) => item.type === "note").length;
  if (filter === "clips") return state.items.filter((item) => item.type !== "note").length;
  if (filter === "pinned") return state.items.filter((item) => item.pinned).length;
  if (["work", "personal", "read-later"].includes(filter)) return state.items.filter((item) => item.collection === filter).length;
  return state.items.filter((item) => Date.now() - Number(item.updatedAt) < 48 * 60 * 60 * 1000).length;
}

function renderCounts() {
  const allCount = countFor("all");
  const notesCount = countFor("notes");
  const clipsCount = countFor("clips");
  const pinnedCount = countFor("pinned");
  const countMap = { all: allCount, notes: notesCount, clips: clipsCount, pinned: pinnedCount };

  $$('[data-count]').forEach((element) => { element.textContent = countMap[element.dataset.count] ?? countFor(element.dataset.count); });
  $$('[data-tab-count]').forEach((element) => { element.textContent = countMap[element.dataset.tabCount] ?? 0; });
  $("#titleCount").textContent = allCount;
}

function renderTabs() {
  $$("[data-filter]").forEach((element) => {
    const isFilterControl = element.classList.contains("nav-item") || element.classList.contains("filter-tab") || element.closest(".topbar-nav");
    if (isFilterControl) element.classList.toggle("is-active", element.dataset.filter === state.filter);
  });
  $("#sortButton span").textContent = "排序";
}

function renderItems() {
  const filtered = getFilteredItems();
  const visible = filtered.slice(0, state.visible);
  const list = $("#itemList");
  const empty = $("#emptyState");
  const hasItems = filtered.length > 0;

  list.classList.toggle("grid-view", state.gridView);
  list.innerHTML = visible.map(renderItemCard).join("");
  list.hidden = !hasItems;
  empty.hidden = hasItems;
  $("#feedCount").textContent = filtered.length;
  $("#visibleCount").textContent = visible.length;
  $("#loadMore").hidden = !hasItems || visible.length >= filtered.length;
  $("#clearSearch").hidden = !state.query;
}

function renderItemCard(item) {
  const meta = typeMeta(item.type);
  const selected = item.id === state.selectedId ? "is-selected" : "";
  const noteClass = item.type === "note" ? "is-note" : item.type === "link" ? "is-link" : item.type === "code" ? "is-code" : "";
  const tags = (item.tags || []).slice(0, 2).map((tag, index) => `<span class="tag ${index === 1 ? (item.type === "note" ? "lavender" : "sage") : ""}">${escapeHTML(tag)}</span>`).join("");
  const preview = item.type === "code" ? escapeHTML(item.content) : escapeHTML(item.content.replace(/\s+/g, " ").trim());

  return `<article class="item-card ${selected} ${noteClass}" data-id="${escapeHTML(item.id)}" tabindex="0">
    <div class="item-icon ${meta.className}">${icon(meta.icon)}</div>
    <div class="item-main">
      <div class="item-meta"><span class="item-kind ${meta.className}">${meta.label}</span><i class="meta-dot"></i><span class="item-time">${escapeHTML(item.timeLabel || "剛剛")}</span></div>
      <h3>${escapeHTML(item.title || "未命名內容")}</h3>
      <p class="item-preview ${item.type === "code" ? "code-preview" : ""}">${preview}</p>
      <div class="item-footer"><span class="item-device">${icon("device")}${escapeHTML(item.device || "此裝置")}</span><span class="item-tags">${tags}</span></div>
    </div>
    <div class="item-actions">
      <button class="card-action ${item.pinned ? "is-pinned" : ""}" type="button" data-action="pin" aria-label="${item.pinned ? "取消釘選" : "釘選"}" title="${item.pinned ? "取消釘選" : "釘選"}">${icon("pin")}</button>
      <button class="card-action" type="button" data-action="copy" aria-label="複製內容" title="複製內容">${icon("copy")}</button>
    </div>
  </article>`;
}

function renderDetail() {
  const container = $("#detailContent");
  const item = state.items.find((candidate) => candidate.id === state.selectedId);
  if (!item) {
    container.innerHTML = `<div class="detail-empty"><span class="empty-icon">${icon("eye")}</span><strong>挑一則內容看看</strong><p>點擊左側任何卡片，這裡會顯示完整內容與快速操作。</p></div>`;
    return;
  }

  const meta = typeMeta(item.type);
  const tags = (item.tags || []).map((tag, index) => `<span class="tag ${index % 2 ? "sage" : ""}">${escapeHTML(tag)}</span>`).join("");
  const isUrl = /^(https?:\/\/|www\.)/i.test(item.content.trim());
  const url = isUrl ? item.content.trim().split(/\s+/)[0] : "";
  const copyClass = item.type === "code" ? "code-copy" : "";

  container.innerHTML = `<div class="detail-body">
    <div class="detail-label ${meta.className}">${icon(meta.icon)}<span>${meta.label} · ${escapeHTML(item.timeLabel || "剛剛")}</span></div>
    <h3 class="detail-title">${escapeHTML(item.title || "未命名內容")}</h3>
    <p class="detail-copy ${copyClass}">${escapeHTML(item.content)}</p>
    ${url ? `<span class="detail-url">${escapeHTML(url)}</span>` : ""}
    <div class="detail-tags">${tags || `<span class="tag">未分類</span>`}</div>
    <div class="detail-meta"><span>${icon("device")}${escapeHTML(item.device || "此裝置")}</span><span>${icon("cloud")}已同步</span></div>
    <div class="detail-actions"><button class="detail-copy-button" type="button" data-detail-action="copy">${icon("copy")}複製內容</button><button class="detail-secondary-button" type="button" data-detail-action="share" title="建立分享連結">${icon("link")}</button><button class="detail-secondary-button" type="button" data-detail-action="edit" title="編輯">${icon("note")}</button><button class="detail-secondary-button ${item.pinned ? "is-pinned" : ""}" type="button" data-detail-action="pin" title="${item.pinned ? "取消釘選" : "釘選"}">${icon("pin")}</button><button class="detail-secondary-button danger" type="button" data-detail-action="delete" title="刪除">${icon("trash")}</button></div>
  </div>`;
}

function render() {
  renderCounts();
  renderTabs();
  renderItems();
  renderDetail();
}

function selectItem(id) {
  if (!state.items.some((item) => item.id === id)) return;
  state.selectedId = id;
  renderItems();
  renderDetail();
}

function updateFilter(filter) {
  state.filter = filter;
  state.visible = 6;
  state.query = "";
  $("#searchInput").value = state.query;
  state.selectedId = getFilteredItems()[0]?.id || null;
  render();
}

function showToast(message) {
  const toast = $("#toast");
  $("#toastMessage").textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

function openDialog(dialog) {
  if (!dialog) return;
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
  dialog.dataset.backdropReady = "pending";
  window.setTimeout(() => {
    if (dialog.open) dialog.dataset.backdropReady = "ready";
  }, 0);
}

function closeDialog(dialog) {
  if (!dialog) return;
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
  delete dialog.dataset.backdropReady;
}

function closeAuthDialog() {
  state.pendingShareId = null;
  closeDialog($("#authDialog"));
}

function openPasswordResetDialog() {
  setPasswordResetMode("request");
  $("#resetGmail").value = state.authGmail || "";
  closeDialog($("#authDialog"));
  openDialog($("#passwordResetDialog"));
  window.setTimeout(() => $("#resetGmail").focus(), 60);
}

function closePasswordResetDialog() {
  closeDialog($("#passwordResetDialog"));
}

function setPasswordResetMode(mode) {
  const confirming = mode === "confirm";
  $("#passwordResetRequestView").hidden = confirming;
  $("#passwordResetConfirmView").hidden = !confirming;
  if (!confirming) {
    $("#resetGmail").value = state.authGmail || "";
  } else {
    $("#resetNewPassword").value = "";
    $("#resetNewPasswordConfirm").value = "";
  }
}

function closeShareDialog() {
  closeDialog($("#shareDialog"));
}

function closeShareGateDialog() {
  closeDialog($("#shareGateDialog"));
  clearShareURL();
}

function bindDialogBackdrop(dialog, closeHandler) {
  if (!dialog) return;
  const isOutside = (event) => {
    const bounds = dialog.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  };
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeHandler();
  });
  document.addEventListener("click", (event) => {
    const backdropTarget = event.target === document || event.target === document.body || event.target === document.documentElement;
    if (dialog.open && dialog.dataset.backdropReady === "ready" && backdropTarget && isOutside(event)) closeHandler();
  });
}

function renderLegalDocument(documentId) {
  const documentData = legalDocuments[documentId] || legalDocuments.terms;
  $("#legalKicker").textContent = documentData.kicker;
  $("#legalTitle").textContent = documentData.title;
  $("#legalDocumentStatus").textContent = "DRAFT / 2026.08.15";
  $("#legalContent").innerHTML = `<p class="legal-intro">${escapeHTML(documentData.intro)}</p>${documentData.sections.map(([heading, body]) => `<section class="legal-section"><h3>${escapeHTML(heading)}</h3><p>${escapeHTML(body)}</p></section>`).join("")}`;
  $$('[data-legal-doc]', $("#legalDialog")).forEach((button) => {
    const active = button.dataset.legalDoc === documentId;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
}

function openLegalDialog(documentId = "terms") {
  state.legalReturnToAuth = Boolean($("#authDialog")?.open);
  state.legalRead[documentId] = true;
  if (state.legalReturnToAuth) closeDialog($("#authDialog"));
  renderLegalDocument(documentId);
  openDialog($("#legalDialog"));
}

function selectLegalDocument(documentId) {
  state.legalRead[documentId] = true;
  renderLegalDocument(documentId);
}

function closeLegalDialog() {
  closeDialog($("#legalDialog"));
  if (state.legalReturnToAuth) {
    state.legalReturnToAuth = false;
    openDialog($("#authDialog"));
    window.setTimeout(() => $("#termsAccepted").focus(), 60);
  }
}

function renderAuthUI() {
  const button = $("#accountButton");
  const label = $("#accountLabel");
  const meta = $("#accountMeta");
  const mark = $("#accountButton use");
  if (!button || !label || !meta || !mark) return;
  button.classList.toggle("is-authenticated", state.authenticated);
  button.setAttribute("aria-label", state.authenticated ? `開啟帳號管理 ${state.authHandle}` : "登入 STOW");
  button.title = state.authenticated ? "帳號管理" : "登入 STOW";
  label.textContent = state.authenticated ? (state.authHandle || "Kei Yang") : "登入";
  meta.textContent = state.authenticated ? "SYNC READY" : "ACCESS / SYNC";
  mark.setAttribute("href", state.authenticated ? "#icon-check" : "#icon-lock");
}

function renderAccessState() {
  const locked = !state.authenticated;
  const main = $("#mainContent");
  const landing = $("#authLanding");
  const content = $("#contentWrap");
  if (!main || !landing || !content) return;
  main.classList.toggle("is-locked", locked);
  landing.hidden = !locked;
  content.hidden = locked;
  content.setAttribute("aria-hidden", String(locked));
  content.inert = locked;
}

function apiErrorMessage(error, fallback = "目前無法完成這個動作") {
  if (!(error instanceof StowApiError)) return fallback;
  const messages = {
    DATABASE_UNAVAILABLE: "服務資料庫目前尚未就緒，請稍後再試",
    INVALID_CREDENTIALS: "帳號名稱或密碼不正確",
    HANDLE_TAKEN: "這個帳號名稱已被使用",
    GMAIL_TAKEN: "這個 Gmail 已被其他帳號使用",
    RECIPIENT_NOT_FOUND: "找不到指定的帳號",
    SHARE_FORBIDDEN: "你沒有權限查看這則內容",
    SHARE_NOT_FOUND: "這條分享連結不存在或已撤銷",
    ITEM_NOT_FOUND: "找不到這則內容，可能已被刪除",
    CURRENT_PASSWORD_INVALID: "目前密碼不正確",
    RESET_INVALID: "重設密碼連結無效或已過期",
    RESET_UNAVAILABLE: "密碼重設信件服務尚未設定，請聯絡管理者",
    CSRF_INVALID: "安全驗證已失效，請重新整理頁面",
    RATE_LIMITED: "嘗試次數過多，請稍後再試",
  };
  return messages[error.code] || error.message || fallback;
}

function showApiError(error, fallback) {
  console.error("STOW API error", error);
  showToast(apiErrorMessage(error, fallback));
}

function renderAccountDialog() {
  const handle = state.authHandle || "nickname";
  $("#accountAvatarLetter").textContent = handle.slice(0, 1).toUpperCase();
  $("#accountHandleTitle").textContent = `@${handle}`;
  $("#accountGmailValue").textContent = state.authGmail || "尚未設定";
  $("#accountGmailInput").value = state.authGmail || "";
  $("#accountSessionStatus").textContent = "HTTPONLY SESSION / 1 YEAR · SYNC READY";
}

function setAccountPanel(panel = null) {
  const gmailOpen = panel === "gmail";
  const passwordOpen = panel === "password";
  $("#gmailPanel").hidden = !gmailOpen;
  $("#passwordPanel").hidden = !passwordOpen;
  $("#editGmailButton").classList.toggle("is-active", gmailOpen);
  $("#managePasswordButton").classList.toggle("is-active", passwordOpen);
  if (gmailOpen) window.setTimeout(() => $("#accountGmailInput").focus(), 60);
  if (passwordOpen) window.setTimeout(() => $("#currentPassword").focus(), 60);
}

function openAccountDialog() {
  if (!state.authenticated) {
    openAuthDialog();
    return;
  }
  renderAccountDialog();
  setAccountPanel();
  openDialog($("#accountDialog"));
}

function closeAccountDialog() {
  setAccountPanel();
  $("#currentPassword").value = "";
  $("#newPassword").value = "";
  $("#newPasswordConfirm").value = "";
  closeDialog($("#accountDialog"));
}

function setAuthenticated(user, items = state.items) {
  state.authenticated = Boolean(user);
  state.authHandle = user?.handle || "";
  state.authGmail = user?.gmail || "";
  if (Array.isArray(items)) state.items = items;
  state.selectedId = state.items[0]?.id || null;
  renderAuthUI();
  renderAccessState();
  render();
}

function clearAuthenticatedUser() {
  state.authenticated = false;
  state.authHandle = "";
  state.authGmail = "";
  state.items = [];
  state.selectedId = null;
  state.pendingShareId = null;
  renderAuthUI();
  renderAccessState();
  render();
}

async function refreshItems() {
  const data = await api("/items");
  state.items = Array.isArray(data.items) ? data.items : [];
  if (!state.items.some((item) => item.id === state.selectedId)) state.selectedId = state.items[0]?.id || null;
  render();
}

function setAuthMode(mode) {
  const registering = mode === "register";
  if (registering) state.legalRead = { terms: false, privacy: false };
  const form = $("#authForm");
  form.dataset.authMode = registering ? "register" : "login";
  const flowIndex = registering ? "01" : "02";
  $("#authVisualIndex").textContent = flowIndex;
  $("#authSignalIndex").textContent = flowIndex;
  $("#authTitle").textContent = registering ? "建立你的 STOW" : "登入你的 STOW";
  $("#authIntro").textContent = registering
    ? "設定帳號名稱與密碼，再留下 Gmail 供日後重設密碼使用。"
    : "登入後才能啟用跨裝置同步，也能建立只開放給特定對象的分享連結。";
  $("#authGmailField").hidden = !registering;
  $("#authConfirmField").hidden = !registering;
  $("#authGmail").required = registering;
  $("#authConfirm").required = registering;
  $("#termsField").hidden = !registering;
  $("#termsAccepted").required = registering;
  $("#authPassword").autocomplete = registering ? "new-password" : "current-password";
  $("#authForm .auth-submit span").textContent = registering ? "建立帳號" : "登入 STOW";
  $("#authSwitchPrompt").textContent = registering ? "已經有帳號？" : "還沒有帳號？";
  $("#signupButton").textContent = registering ? "登入" : "建立帳號";
  $("#authRecovery").hidden = registering;
  $("#authLinksDivider").hidden = registering;
}

function openAuthDialog(pendingShareId = null) {
  state.pendingShareId = pendingShareId;
  setAuthMode("login");
  $("#authHandle").value = state.authHandle || "";
  $("#authGmail").value = state.authGmail || "";
  $("#authPassword").value = "";
  $("#authConfirm").value = "";
  $("#termsAccepted").checked = false;
  $("#authPassword").required = true;
  openDialog($("#authDialog"));
  window.setTimeout(() => $("#authHandle").focus(), 60);
}

function updateShareAccess() {
  const access = $("input[name='shareAccess']:checked")?.value || "recipient";
  state.shareAccess = access;
  const recipientField = $("#shareRecipientField");
  const handle = $("#shareHandle");
  const note = $("#shareNote span");
  recipientField.hidden = access !== "recipient";
  handle.required = access === "recipient";
  note.textContent = access === "recipient"
    ? "連結可以被轉寄，但只有這個帳號登入後才能讀取內容。"
    : "任何拿到這條連結的人都可以查看；請只分享給你信任的人。";
}

function openShareDialog(item) {
  if (!item) return;
  if (!state.authenticated) {
    showToast("請先登入，才能建立分享連結");
    openAuthDialog(item.id);
    return;
  }

  state.shareItemId = item.id;
  state.shareAccess = "recipient";
  $("#shareItemTitle").textContent = item.title || "未命名內容";
  $("#shareHandle").value = "";
  $("#shareLink").value = "";
  $("#generatedShare").hidden = true;
  $("#generateShare span").textContent = "建立分享連結";
  $("input[name='shareAccess'][value='recipient']").checked = true;
  updateShareAccess();
  openDialog($("#shareDialog"));
}

function renderSharedPreview(item) {
  if (!item) return;
  $("#sharedPreviewTitle").textContent = item.title || "STOW 內容";
  $("#sharedPreviewMeta").textContent = `${typeMeta(item.type).label} · ${item.timeLabel || "剛剛"}`;
  $("#sharedPreviewContent").textContent = item.content || "";
  state.sharedItem = item;
  openDialog($("#sharedPreviewDialog"));
}

function configureShareGate(access, title = "STOW 內容") {
  state.shareAccess = access === "link" ? "link" : "recipient";
  $("#shareGateItemTitle").textContent = title || "STOW 內容";
  $("#shareGateHandle").value = "";
  $("#shareGatePassword").value = "";
  $("#shareGateHandleField").hidden = state.shareAccess === "link";
  $("#shareGatePasswordField").hidden = state.shareAccess === "link";
  $("#shareGateHandle").required = state.shareAccess !== "link";
  $("#shareGatePassword").required = state.shareAccess !== "link";
  $("#shareGateSubmit span").textContent = state.shareAccess === "link" ? "開啟分享內容" : "登入並查看";
  $("#shareGateDescription").textContent = state.shareAccess === "link"
    ? "任何拿到這條連結的人都可以查看這則內容。"
    : "這條連結只開放給指定的帳號。請使用帳號名稱與密碼登入。";
  openDialog($("#shareGateDialog"));
}

async function openShareGateFromURL() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("share");
  if (!token) return;
  state.shareToken = token;
  try {
    const data = await api(`/shares/${encodeURIComponent(token)}`);
    renderSharedPreview(data.item);
  } catch (error) {
    if (error instanceof StowApiError && error.code === "AUTH_REQUIRED") {
      configureShareGate(error.data.access, error.data.title);
      return;
    }
    showApiError(error, "無法開啟這條分享連結");
  }
}

function clearShareURL() {
  const url = new URL(window.location.href);
  url.search = "";
  window.history.replaceState({}, "", url.toString());
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (error) {
      console.warn("Clipboard API unavailable, using fallback", error);
    }
  }
  const helper = document.createElement("textarea");
  helper.value = value;
  helper.style.position = "fixed";
  helper.style.opacity = "0";
  document.body.appendChild(helper);
  helper.select();
  const copied = document.execCommand("copy");
  helper.remove();
  return copied;
}

async function copyItem(item) {
  const copied = await copyText(item.content);
  showToast(copied ? "已複製到剪貼簿" : "瀏覽器阻擋了複製，請手動選取");
}

async function togglePin(item) {
  try {
    const data = await api(`/items/${encodeURIComponent(item.id)}`, { method: "PATCH", body: { pinned: !item.pinned } });
    const index = state.items.findIndex((candidate) => candidate.id === item.id);
    if (index >= 0) state.items[index] = data.item;
    render();
    showToast(data.item.pinned ? "已釘選這則內容" : "已取消釘選");
  } catch (error) {
    showApiError(error, "無法更新釘選狀態");
  }
}

async function deleteItem(item) {
  if (!window.confirm(`確定要刪除「${item.title || "未命名內容"}」嗎？`)) return;
  try {
    await api(`/items/${encodeURIComponent(item.id)}`, { method: "DELETE" });
    state.items = state.items.filter((candidate) => candidate.id !== item.id);
    state.selectedId = state.items[0]?.id || null;
    render();
    showToast("內容已刪除");
  } catch (error) {
    showApiError(error, "無法刪除這則內容");
  }
}

function editItem(item) {
  state.editingId = item.id;
  state.captureMode = item.type === "note" ? "note" : "clip";
  setCaptureMode(state.captureMode);
  $("#entryTitle").value = item.title || "";
  $("#entryContent").value = item.content || "";
  $("#entryTags").value = (item.tags || []).join(", ");
  $("#saveEntry span").textContent = "更新內容";
  updateCharCount();
  $("#captureCard").scrollIntoView({ behavior: "smooth", block: "center" });
  $("#entryContent").focus();
  showToast("已載入編輯模式");
}

function resetComposer() {
  state.editingId = null;
  $("#entryTitle").value = "";
  $("#entryContent").value = "";
  $("#entryTags").value = "";
  $("#saveEntry span").textContent = "儲存內容";
  updateCharCount();
}

async function saveEntry() {
  if (!state.authenticated) {
    showToast("登入後才能保存內容");
    openAuthDialog();
    return;
  }
  const content = $("#entryContent").value.trim();
  const titleInput = $("#entryTitle").value.trim();
  const tags = $("#entryTags").value.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 4);
  if (!content) {
    $("#entryContent").focus();
    showToast("先貼一點內容進來吧");
    return;
  }

  const type = state.captureMode === "note" ? "note" : inferType(content);
  const inferredTitle = type === "link" ? "稍後閱讀的連結" : type === "code" ? "新的程式碼片段" : content.split("\n")[0].slice(0, 38);
  const title = titleInput || inferredTitle || "未命名內容";

  try {
    const payload = { type, title, content, tags, device: "此裝置", collection: state.captureMode === "note" ? "personal" : "work" };
    if (state.editingId) {
      const data = await api(`/items/${encodeURIComponent(state.editingId)}`, { method: "PATCH", body: payload });
      const index = state.items.findIndex((item) => item.id === state.editingId);
      if (index >= 0) state.items[index] = data.item;
      state.selectedId = data.item.id;
      showToast("內容已更新");
    } else {
      const data = await api("/items", { method: "POST", body: payload });
      state.items.unshift(data.item);
      state.selectedId = data.item.id;
      showToast("已收進你的 STOW");
    }
    resetComposer();
    render();
  } catch (error) {
    showApiError(error, "無法保存內容");
  }
}

function setCaptureMode(mode) {
  state.captureMode = mode;
  $$("[data-capture-mode]").forEach((button) => {
    const active = button.dataset.captureMode === mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  const titleInput = $("#entryTitle");
  titleInput.hidden = mode !== "note";
  $("#entryContent").placeholder = mode === "note" ? "寫下現在想留住的想法⋯" : "貼上任何內容⋯ 文字、連結、程式碼，或一個突然想到的點子。";
}

function updateCharCount() {
  const count = $("#entryContent").value.length;
  $("#charCount").textContent = `${count.toLocaleString("zh-TW")} 字`;
}

function toggleMobileMenu(force) {
  const sidebar = $("#sidebar");
  const overlay = $("#mobileOverlay");
  const open = typeof force === "boolean" ? force : !sidebar.classList.contains("is-open");
  sidebar.classList.toggle("is-open", open);
  overlay.classList.toggle("is-visible", open);
}

function openShortcuts() {
  const dialog = $("#shortcutsDialog");
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function closeShortcuts() {
  const dialog = $("#shortcutsDialog");
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

// Navigation filters share one state so the sidebar and toolbar always agree.
$$('[data-filter]').forEach((element) => {
  element.addEventListener("click", () => {
    updateFilter(element.dataset.filter);
    if (window.innerWidth < 940) toggleMobileMenu(false);
  });
});

$("#itemList").addEventListener("click", (event) => {
  const card = event.target.closest("[data-id]");
  if (!card) return;
  const item = state.items.find((candidate) => candidate.id === card.dataset.id);
  if (!item) return;
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "copy") copyItem(item);
  else if (action === "pin") togglePin(item);
  else selectItem(item.id);
});

$("#itemList").addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && event.target.closest("[data-id]")) {
    event.preventDefault();
    selectItem(event.target.closest("[data-id]").dataset.id);
  }
});

$("#detailContent").addEventListener("click", (event) => {
  const action = event.target.closest("[data-detail-action]")?.dataset.detailAction;
  if (!action) return;
  const item = state.items.find((candidate) => candidate.id === state.selectedId);
  if (!item) return;
  if (action === "copy") copyItem(item);
  if (action === "share") openShareDialog(item);
  if (action === "pin") togglePin(item);
  if (action === "edit") editItem(item);
  if (action === "delete") deleteItem(item);
});

$("#searchInput").addEventListener("input", (event) => {
  state.query = event.target.value;
  state.visible = 6;
  const filtered = getFilteredItems();
  if (!filtered.some((item) => item.id === state.selectedId)) state.selectedId = filtered[0]?.id || null;
  renderItems();
  renderDetail();
});

$("#clearSearch").addEventListener("click", () => {
  state.query = "";
  $("#searchInput").value = "";
  renderItems();
});

$("#emptyReset").addEventListener("click", () => {
  updateFilter("all");
});

$("#loadMore").addEventListener("click", () => {
  state.visible += 4;
  renderItems();
});

$("#listViewButton").addEventListener("click", () => {
  state.gridView = false;
  $("#listViewButton").classList.add("is-active");
  $("#gridViewButton").classList.remove("is-active");
  renderItems();
});

$("#gridViewButton").addEventListener("click", () => {
  state.gridView = true;
  $("#gridViewButton").classList.add("is-active");
  $("#listViewButton").classList.remove("is-active");
  renderItems();
});

$("#sortButton").addEventListener("click", () => {
  state.sort = state.sort === "recent" ? "oldest" : "recent";
  renderItems();
  renderTabs();
});

$("[data-capture-mode='clip']").addEventListener("click", () => setCaptureMode("clip"));
$("[data-capture-mode='note']").addEventListener("click", () => setCaptureMode("note"));
$("#entryContent").addEventListener("input", updateCharCount);
$("#entryTitle").addEventListener("keydown", (event) => { if (event.key === "Enter") event.preventDefault(); });
$("#saveEntry").addEventListener("click", saveEntry);

$("#accountButton").addEventListener("click", () => state.authenticated ? openAccountDialog() : openAuthDialog());
$("#landingLogin").addEventListener("click", () => openAuthDialog());
$("#landingRegister").addEventListener("click", () => {
  openAuthDialog();
  setAuthMode("register");
});
$("#closeAuth").addEventListener("click", closeAuthDialog);
$("#closeAccount").addEventListener("click", closeAccountDialog);
$("#editGmailButton").addEventListener("click", () => setAccountPanel("gmail"));
$("#managePasswordButton").addEventListener("click", () => setAccountPanel("password"));
$("#cancelGmail").addEventListener("click", () => setAccountPanel());
$("#cancelPassword").addEventListener("click", () => setAccountPanel());

$("#authForm").addEventListener("submit", (event) => {
  event.preventDefault();
  void (async () => {
    const form = event.currentTarget;
    const registering = form.dataset.authMode === "register";
    const password = $("#authPassword");
    const confirm = $("#authConfirm");
    confirm.setCustomValidity(registering && password.value !== confirm.value ? "兩次輸入的密碼不一致" : "");
    if (!form.reportValidity()) {
      confirm.setCustomValidity("");
      return;
    }
    if (registering && (!state.legalRead.terms || !state.legalRead.privacy)) {
      showToast("請先查看服務條款與隱私政策");
      return;
    }
    const handle = $("#authHandle").value.trim();
    const gmail = $("#authGmail").value.trim();
    try {
      if (registering) {
        await api("/auth/register", {
          method: "POST",
          body: { handle, gmail, password: password.value, termsAccepted: true, privacyAccepted: true },
        });
        state.authHandle = handle.toLowerCase();
        state.authGmail = gmail.toLowerCase();
        setAuthMode("login");
        $("#authHandle").value = handle;
        $("#authPassword").value = "";
        $("#authConfirm").value = "";
        $("#termsAccepted").checked = false;
        showToast("帳號已建立 · 請登入 STOW");
        window.setTimeout(() => $("#authHandle").focus(), 60);
        return;
      }
      const pendingShareId = state.pendingShareId;
      const data = await api("/auth/login", { method: "POST", body: { handle, password: password.value } });
      setAuthenticated(data.user, []);
      await refreshItems();
      state.pendingShareId = null;
      closeDialog($("#authDialog"));
      showToast("已登入 STOW · 同步已開啟");
      if (pendingShareId) {
        window.setTimeout(() => openShareDialog(state.items.find((item) => item.id === pendingShareId)), 120);
      }
    } catch (error) {
      showApiError(error, registering ? "無法建立帳號" : "無法登入 STOW");
    } finally {
      confirm.setCustomValidity("");
    }
  })();
});

$("#gmailPanel").addEventListener("submit", (event) => {
  event.preventDefault();
  void (async () => {
    const input = $("#accountGmailInput");
    if (!input.checkValidity()) {
      input.reportValidity();
      return;
    }
    try {
      const data = await api("/me", { method: "PATCH", body: { gmail: input.value.trim() } });
      setAuthenticated(data.user);
      setAccountPanel();
      renderAccountDialog();
      showToast("Gmail 已更新 · 可用於密碼重設");
    } catch (error) {
      showApiError(error, "無法更新 Gmail");
    }
  })();
});

$("#passwordPanel").addEventListener("submit", (event) => {
  event.preventDefault();
  void (async () => {
    const form = event.currentTarget;
    const password = $("#newPassword");
    const confirm = $("#newPasswordConfirm");
    confirm.setCustomValidity(password.value !== confirm.value ? "兩次輸入的新密碼不一致" : "");
    if (!form.reportValidity()) {
      confirm.setCustomValidity("");
      return;
    }
    try {
      const data = await api("/me/password", {
        method: "PATCH",
        body: { currentPassword: $("#currentPassword").value, newPassword: password.value },
      });
      setAccountPanel();
      $("#currentPassword").value = "";
      $("#newPassword").value = "";
      $("#newPasswordConfirm").value = "";
      showToast(data.message || "密碼已更新");
    } catch (error) {
      showApiError(error, "無法更新密碼");
    } finally {
      confirm.setCustomValidity("");
    }
  })();
});

$("#accountLogout").addEventListener("click", () => {
  void (async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch (error) {
      console.warn("Unable to revoke STOW session", error);
    }
    closeAccountDialog();
    clearAuthenticatedUser();
    showToast("已登出 STOW");
  })();
});

$("#forgotPasswordButton").addEventListener("click", openPasswordResetDialog);
$("#backToAuth").addEventListener("click", () => {
  const pendingShareId = state.pendingShareId;
  closePasswordResetDialog();
  openAuthDialog(pendingShareId);
});

$("#passwordResetForm").addEventListener("submit", (event) => {
  event.preventDefault();
  void (async () => {
    const gmail = $("#resetGmail");
    if (!gmail.checkValidity()) {
      gmail.reportValidity();
      return;
    }
    try {
      const data = await api("/auth/password-reset/request", { method: "POST", body: { gmail: gmail.value.trim() } });
      closePasswordResetDialog();
      openAuthDialog(state.pendingShareId);
      showToast(data.message || "若帳號存在，重設密碼連結已寄出");
    } catch (error) {
      showApiError(error, "無法寄送重設密碼連結");
    }
  })();
});

$("#passwordResetConfirmForm").addEventListener("submit", (event) => {
  event.preventDefault();
  void (async () => {
    const form = event.currentTarget;
    const password = $("#resetNewPassword");
    const confirm = $("#resetNewPasswordConfirm");
    confirm.setCustomValidity(password.value !== confirm.value ? "兩次輸入的新密碼不一致" : "");
    if (!form.reportValidity()) {
      confirm.setCustomValidity("");
      return;
    }
    try {
      const data = await api("/auth/password-reset/confirm", {
        method: "POST",
        body: { token: passwordResetToken, password: password.value },
      });
      closePasswordResetDialog();
      clearShareURL();
      openAuthDialog();
      showToast(data.message || "密碼已重設，請重新登入");
    } catch (error) {
      showApiError(error, "無法重設密碼");
    } finally {
      confirm.setCustomValidity("");
    }
  })();
});

$("#signupButton").addEventListener("click", () => {
  const registering = $("#authForm").dataset.authMode === "register";
  setAuthMode(registering ? "login" : "register");
});

$$("[data-legal-doc]").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.closest("#legalDialog")) selectLegalDocument(button.dataset.legalDoc);
    else openLegalDialog(button.dataset.legalDoc);
  });
});
$("#closeLegal").addEventListener("click", closeLegalDialog);
$("#legalDone").addEventListener("click", closeLegalDialog);
bindDialogBackdrop($("#shortcutsDialog"), closeShortcuts);
bindDialogBackdrop($("#authDialog"), closeAuthDialog);
bindDialogBackdrop($("#accountDialog"), closeAccountDialog);
bindDialogBackdrop($("#passwordResetDialog"), closePasswordResetDialog);
bindDialogBackdrop($("#legalDialog"), closeLegalDialog);
bindDialogBackdrop($("#shareDialog"), closeShareDialog);
bindDialogBackdrop($("#shareGateDialog"), closeShareGateDialog);
bindDialogBackdrop($("#sharedPreviewDialog"), () => {
  closeDialog($("#sharedPreviewDialog"));
  clearShareURL();
});

$$('input[name="shareAccess"]').forEach((input) => input.addEventListener("change", updateShareAccess));
$("#shareForm").addEventListener("submit", (event) => {
  event.preventDefault();
  void (async () => {
    const item = state.items.find((candidate) => candidate.id === state.shareItemId);
    if (!item) return;
    const handle = $("#shareHandle");
    if (state.shareAccess === "recipient" && !handle.checkValidity()) {
      handle.reportValidity();
      return;
    }
    try {
      const data = await api("/shares", {
        method: "POST",
        body: { itemId: item.id, access: state.shareAccess, recipientHandle: handle.value.trim() },
      });
      state.shareToken = data.token;
      $("#shareLink").value = data.url;
      $("#generatedShare").hidden = false;
      $("#generateShare span").textContent = "重新建立分享連結";
      showToast(state.shareAccess === "recipient" ? "已建立指定對象分享連結" : "已建立公開分享連結");
    } catch (error) {
      showApiError(error, "無法建立分享連結");
    }
  })();
});
$("#copyShareLink").addEventListener("click", async () => {
  const copied = await copyText($("#shareLink").value);
  showToast(copied ? "分享網址已複製" : "請手動複製分享網址");
});
$("#closeShare").addEventListener("click", closeShareDialog);
$("#cancelShare").addEventListener("click", closeShareDialog);
$("#closeSharedPreview").addEventListener("click", () => {
  closeDialog($("#sharedPreviewDialog"));
  clearShareURL();
});
$("#sharedPreviewDone").addEventListener("click", () => {
  closeDialog($("#sharedPreviewDialog"));
  clearShareURL();
});
$("#sharedPreviewCopy").addEventListener("click", async () => {
  if (!state.sharedItem) return;
  const copied = await copyText(state.sharedItem.content);
  showToast(copied ? "內容已複製" : "請手動選取內容");
});

$("#shareGateForm").addEventListener("submit", (event) => {
  event.preventDefault();
  void (async () => {
    try {
      if (state.shareAccess !== "link") {
        const handle = $("#shareGateHandle");
        const password = $("#shareGatePassword");
        if (!handle.checkValidity()) {
          handle.reportValidity();
          return;
        }
        if (!password.checkValidity()) {
          password.reportValidity();
          return;
        }
        const login = await api("/auth/login", { method: "POST", body: { handle: handle.value.trim(), password: password.value } });
        setAuthenticated(login.user, []);
        await refreshItems();
      }
      const data = await api(`/shares/${encodeURIComponent(state.shareToken || "")}`);
      closeShareGateDialog();
      renderSharedPreview(data.item);
      showToast("已開啟分享內容");
    } catch (error) {
      showApiError(error, "無法開啟分享內容");
    }
  })();
});

$("#syncButton").addEventListener("click", () => {
  void (async () => {
    if (!state.authenticated) {
      showToast("登入後才能啟用跨裝置同步");
      openAuthDialog();
      return;
    }
    const button = $("#syncButton");
    button.classList.remove("is-spinning");
    void button.offsetWidth;
    button.classList.add("is-spinning");
    try {
      await refreshItems();
      setTimeout(() => showToast(`已完成同步 · ${state.items.length} 則內容`), 450);
    } catch (error) {
      showApiError(error, "同步失敗，請稍後再試");
    }
  })();
});

$("#mobileMenu").addEventListener("click", () => toggleMobileMenu());
$("#mobileOverlay").addEventListener("click", () => toggleMobileMenu(false));
$("#openShortcuts").addEventListener("click", openShortcuts);
$("#closeShortcuts").addEventListener("click", closeShortcuts);
$("#topHelp").addEventListener("click", openShortcuts);
$("#openSettings").addEventListener("click", () => state.authenticated ? openAccountDialog() : openAuthDialog());
$("#addCollection").addEventListener("click", () => showToast("分類功能會在下一版加入"));
$("#closeDetail").addEventListener("click", () => {
  state.selectedId = null;
  renderDetail();
  renderItems();
});

document.addEventListener("keydown", (event) => {
  const activeTag = document.activeElement?.tagName;
  const typing = activeTag === "INPUT" || activeTag === "TEXTAREA";
  const superKey = event.metaKey || event.getModifierState?.("Meta") || event.getModifierState?.("OS") || event.getModifierState?.("Super");
  if (!state.authenticated && !typing && (event.key === "/" || event.key.toLowerCase() === "n" || ((superKey || event.ctrlKey) && event.key === "Enter"))) {
    event.preventDefault();
    openAuthDialog();
    return;
  }
  if (event.key === "/" && !typing) {
    event.preventDefault();
    $("#searchInput").focus();
  }
  if (event.key.toLowerCase() === "n" && !typing) {
    event.preventDefault();
    $("#captureCard").scrollIntoView({ behavior: "smooth", block: "center" });
    $("#entryContent").focus();
  }
  if ((superKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    saveEntry();
  }
  if (event.key === "Escape") {
    closeShortcuts();
    const legalWasOpen = Boolean($("#legalDialog")?.open);
    closeLegalDialog();
    if (!legalWasOpen) {
      closeDialog($("#authDialog"));
      closeAccountDialog();
      closePasswordResetDialog();
    }
    closeDialog($("#shareDialog"));
    closeDialog($("#shareGateDialog"));
    closeDialog($("#sharedPreviewDialog"));
    toggleMobileMenu(false);
  }
});

const storedTheme = localStorage.getItem("stow-theme");
if (storedTheme === "dark" || storedTheme === "light") document.body.dataset.theme = storedTheme;
$("#themeToggle").addEventListener("click", () => {
  const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
  document.body.dataset.theme = nextTheme;
  localStorage.setItem("stow-theme", nextTheme);
});

setCaptureMode(state.captureMode);
updateCharCount();
render();
renderAuthUI();
renderAccessState();
renderLegalDocument("terms");

async function openPasswordResetFromURL() {
  const token = new URLSearchParams(window.location.search).get("reset");
  if (!token) return false;
  passwordResetToken = token;
  clearShareURL();
  setPasswordResetMode("confirm");
  openDialog($("#passwordResetDialog"));
  window.setTimeout(() => $("#resetNewPassword").focus(), 60);
  return true;
}

async function bootstrap() {
  try {
    await loadCsrfToken();
    const session = await api("/me");
    if (session.user) {
      setAuthenticated(session.user, []);
      await refreshItems();
    }
  } catch (error) {
    showApiError(error, "目前無法連線到 STOW 服務");
  }
  if (!(await openPasswordResetFromURL())) await openShareGateFromURL();
}

void bootstrap();
