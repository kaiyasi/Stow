import { computed, reactive } from "vue";

import { api, apiErrorMessage, StowApiError } from "./api";

export const legalDocuments = {
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
      ["02 / 使用目的", "資料會用來提供登入、跨裝置同步、內容搜尋、分享權限驗證與密碼重設。STOW 不會把你的內容當成公開內容展示，也不會因為你使用記事功能就自動分享到其他地方。"],
      ["03 / 分享時的資料流動", "指定對象分享只會儲存分享者、內容與指定帳號的關聯；公開連結分享則代表取得連結的人可能查看內容。你可以撤銷尚未失效的分享連結。"],
      ["04 / Cookie 與安全", "登入狀態使用 HttpOnly Session Cookie 保存一年，另使用 CSRF Cookie 保護變更資料的要求。服務會依正式部署的 HTTPS 設定 Secure Cookie。"],
      ["05 / 你的選擇", "你可以修改 recovery Gmail、更新密碼、刪除內容或登出所有工作階段。若要刪除帳號資料，請聯絡服務管理者。"],
    ],
  },
};

export const state = reactive({
  bootstrapped: false,
  loading: false,
  authenticated: false,
  user: null,
  items: [],
  filter: "all",
  query: "",
  visible: 6,
  selectedId: null,
  captureMode: "clip",
  gridView: false,
  sort: "recent",
  editingId: null,
  captureDraft: { title: "", content: "", tags: "" },
  mobileMenu: false,
  theme: localStorage.getItem("stow-theme") === "dark" ? "dark" : "light",
  toast: { visible: false, message: "" },
  modal: { account: false, shortcuts: false, passwordReset: false, legal: false, share: false, shareGate: false, preview: false },
  legalDocument: "terms",
  passwordResetView: "request",
  passwordResetToken: "",
  share: { itemId: null, access: "recipient", token: "", url: "", generated: false, gateAccess: "recipient", itemTitle: "STOW 內容", sharedItem: null },
});

export const filteredItems = computed(() => {
  const query = state.query.trim().toLowerCase();
  let items = [...state.items];
  if (state.filter === "notes") items = items.filter((item) => item.type === "note");
  if (state.filter === "clips") items = items.filter((item) => item.type !== "note");
  if (state.filter === "pinned") items = items.filter((item) => item.pinned);
  if (["work", "personal", "read-later"].includes(state.filter)) items = items.filter((item) => item.collection === state.filter);
  if (state.filter === "recent") items = items.filter((item) => Date.now() - Number(item.updatedAt) < 48 * 60 * 60 * 1000);
  if (query) items = items.filter((item) => [item.title, item.content, ...(item.tags || []), item.device].join(" ").toLowerCase().includes(query));
  return items.sort((a, b) => state.sort === "recent" ? Number(b.updatedAt) - Number(a.updatedAt) : Number(a.updatedAt) - Number(b.updatedAt));
});

export const selectedItem = computed(() => state.items.find((item) => item.id === state.selectedId) || null);
export const visibleItems = computed(() => filteredItems.value.slice(0, state.visible));
export const counts = computed(() => ({
  all: state.items.length,
  notes: state.items.filter((item) => item.type === "note").length,
  clips: state.items.filter((item) => item.type !== "note").length,
  pinned: state.items.filter((item) => item.pinned).length,
  work: state.items.filter((item) => item.collection === "work").length,
  personal: state.items.filter((item) => item.collection === "personal").length,
  "read-later": state.items.filter((item) => item.collection === "read-later").length,
  recent: state.items.filter((item) => Date.now() - Number(item.updatedAt) < 48 * 60 * 60 * 1000).length,
}));

export function typeMeta(type) {
  return {
    clip: { label: "CLIP", icon: "copy", className: "" },
    note: { label: "NOTE", icon: "note", className: "note" },
    link: { label: "LINK", icon: "link", className: "link" },
    code: { label: "CODE", icon: "code", className: "code" },
  }[type] || { label: "CLIP", icon: "copy", className: "" };
}

export function inferType(content) {
  const text = content.trim();
  if (/^(https?:\/\/|www\.)/i.test(text)) return "link";
  if (/^(git |npm |const |let |function |import |export |SELECT |<\/?[a-z])/im.test(text) || /[{};]\s*$/m.test(text)) return "code";
  return "clip";
}

function syncSelection() {
  if (!filteredItems.value.some((item) => item.id === state.selectedId)) state.selectedId = filteredItems.value[0]?.id || null;
}

export function showToast(message) {
  state.toast.message = message;
  state.toast.visible = true;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => { state.toast.visible = false; }, 2400);
}

export function showApiError(error, fallback) {
  console.error("STOW API error", error);
  showToast(apiErrorMessage(error, fallback));
}

export function openModal(name) { state.modal[name] = true; }
export function closeModal(name) { state.modal[name] = false; }

export function setFilter(filter) {
  state.filter = filter;
  state.visible = 6;
  state.query = "";
  syncSelection();
}

export function setQuery(query) {
  state.query = query;
  state.visible = 6;
  syncSelection();
}

export function toggleSort() { state.sort = state.sort === "recent" ? "oldest" : "recent"; }
export function setGridView(value) { state.gridView = value; }
export function setTheme(theme) {
  state.theme = theme;
  localStorage.setItem("stow-theme", theme);
  document.body.dataset.theme = theme;
}

export function resetCapture() {
  state.editingId = null;
  state.captureDraft.title = "";
  state.captureDraft.content = "";
  state.captureDraft.tags = "";
}

export function editItem(item) {
  state.editingId = item.id;
  state.captureDraft.title = item.title || "";
  state.captureDraft.content = item.content || "";
  state.captureDraft.tags = (item.tags || []).join(", ");
  state.captureMode = item.type === "note" ? "note" : "clip";
  window.setTimeout(() => document.querySelector("#entryContent")?.focus(), 60);
}

export async function refreshItems() {
  const data = await api("/items");
  state.items = Array.isArray(data.items) ? data.items : [];
  syncSelection();
}

export function setUser(user) {
  state.user = user || null;
  state.authenticated = Boolean(user);
  if (!user) {
    state.items = [];
    state.selectedId = null;
  }
}

export async function bootstrap() {
  state.loading = true;
  try {
    const session = await api("/me");
    if (session.user) {
      setUser(session.user);
      await refreshItems();
    }
  } catch (error) {
    showApiError(error, "目前無法連線到 STOW 服務");
  } finally {
    state.loading = false;
    state.bootstrapped = true;
  }
}

export async function login(handle, password) {
  const data = await api("/auth/login", { method: "POST", body: { handle: handle.trim(), password } });
  setUser(data.user);
  await refreshItems();
  return data.user;
}

export async function registerAccount({ handle, gmail, password }) {
  return api("/auth/register", { method: "POST", body: { handle: handle.trim(), gmail: gmail.trim(), password, termsAccepted: true, privacyAccepted: true } });
}

export async function logout() {
  try { await api("/auth/logout", { method: "POST" }); } catch (error) { console.warn("Unable to revoke STOW session", error); }
  setUser(null);
}

export async function saveCapture() {
  const content = state.captureDraft.content.trim();
  if (!content) { showToast("先貼上一段內容，再收進 STOW"); return false; }
  const payload = {
    type: state.captureMode === "note" ? "note" : inferType(content),
    title: state.captureDraft.title.trim(),
    content,
    tags: state.captureDraft.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    collection: "work",
  };
  try {
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
    resetCapture();
    return true;
  } catch (error) {
    showApiError(error, "無法保存內容");
    return false;
  }
}

export async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(value); return true; } catch (error) { console.warn("Clipboard API unavailable", error); }
  }
  const area = document.createElement("textarea");
  area.value = value; area.style.position = "fixed"; area.style.opacity = "0";
  document.body.appendChild(area); area.select();
  const copied = document.execCommand("copy"); area.remove(); return copied;
}

export async function copyItem(item) {
  showToast(await copyText(item.content) ? "內容已複製" : "請手動選取內容");
}

export async function togglePin(item) {
  try {
    const data = await api(`/items/${encodeURIComponent(item.id)}`, { method: "PATCH", body: { pinned: !item.pinned } });
    const index = state.items.findIndex((candidate) => candidate.id === item.id);
    if (index >= 0) state.items[index] = data.item;
  } catch (error) { showApiError(error, "無法更新釘選狀態"); }
}

export async function deleteItem(item) {
  if (!window.confirm("確定要刪除這則內容嗎？")) return;
  try {
    await api(`/items/${encodeURIComponent(item.id)}`, { method: "DELETE" });
    state.items = state.items.filter((candidate) => candidate.id !== item.id);
    syncSelection(); showToast("內容已刪除");
  } catch (error) { showApiError(error, "無法刪除內容"); }
}

export async function updateGmail(gmail) {
  const data = await api("/me", { method: "PATCH", body: { gmail: gmail.trim() } });
  setUser(data.user); return data.user;
}

export async function updatePassword(currentPassword, newPassword) {
  const data = await api("/me/password", { method: "PATCH", body: { currentPassword, newPassword } });
  return data;
}

export function openShare(item) {
  state.share.itemId = item.id;
  state.share.access = "recipient";
  state.share.generated = false;
  state.share.url = "";
  state.share.token = "";
  state.share.itemTitle = item.title || "未命名內容";
  openModal("share");
}

export async function createShare(recipientHandle = "") {
  const data = await api("/shares", { method: "POST", body: { itemId: state.share.itemId, access: state.share.access, recipientHandle: recipientHandle.trim() } });
  state.share.token = data.token; state.share.url = data.url; state.share.generated = true;
  showToast(state.share.access === "recipient" ? "已建立指定對象分享連結" : "已建立公開分享連結");
}

export async function loadShare(token) {
  state.share.token = token;
  try {
    const data = await api(`/shares/${encodeURIComponent(token)}`);
    state.share.sharedItem = data.item;
    openModal("preview");
    return "preview";
  } catch (error) {
    if (error instanceof StowApiError && error.code === "AUTH_REQUIRED") {
      state.share.gateAccess = error.data.access || "recipient";
      state.share.itemTitle = error.data.title || "STOW 內容";
      openModal("shareGate");
      return "gate";
    }
    showApiError(error, "無法開啟這條分享連結");
    return "error";
  }
}

export async function openShareGate(handle, password) {
  if (state.share.gateAccess !== "link") {
    const data = await login(handle, password);
    if (!data) return;
  }
  const data = await api(`/shares/${encodeURIComponent(state.share.token)}`);
  state.share.sharedItem = data.item;
  closeModal("shareGate"); openModal("preview");
}

export async function requestPasswordReset(gmail) {
  const data = await api("/auth/password-reset/request", { method: "POST", body: { gmail: gmail.trim() } });
  showToast(data.message || "若帳號存在，重設連結已寄出");
}

export async function confirmPasswordReset(token, password) {
  const data = await api("/auth/password-reset/confirm", { method: "POST", body: { token, password } });
  showToast(data.message || "密碼已重設，請重新登入");
}
