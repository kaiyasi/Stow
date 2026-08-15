const API_ROOT = "/api";
let csrfToken = "";
let csrfPromise = null;

export class StowApiError extends Error {
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

export async function api(path, options = {}) {
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

export function apiErrorMessage(error, fallback = "目前無法完成這個動作") {
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
