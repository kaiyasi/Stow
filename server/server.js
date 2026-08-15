import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import bcrypt from "bcryptjs";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import nodemailer from "nodemailer";
import pg from "pg";

const { Pool } = pg;
const app = express();
const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.APP_PORT || process.env.PORT || 3000);
const host = process.env.APP_HOST || "0.0.0.0";
const sessionMaxAge = 60 * 60 * 24 * 365;
const passwordResetMaxAge = 60 * 60;
const sessionCookieName = "stow_session";
const csrfCookieName = "stow_csrf";
const passwordRounds = 12;
const maxContentLength = 200_000;
const serverRoot = path.dirname(fileURLToPath(import.meta.url));
const publicRoot = path.resolve(process.env.PUBLIC_ROOT || path.join(serverRoot, ".."));

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      imgSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      ...(isProduction ? { upgradeInsecureRequests: [] } : {}),
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(express.json({ limit: "256kb" }));

function createPool() {
  const hasDiscreteConfig = process.env.POSTGRES_HOST || process.env.PGHOST;
  if (hasDiscreteConfig) {
    return new Pool({
      host: process.env.POSTGRES_HOST || process.env.PGHOST,
      port: Number(process.env.POSTGRES_PORT || process.env.PGPORT || 5432),
      database: process.env.POSTGRES_DB || process.env.PGDATABASE || "stow",
      user: process.env.POSTGRES_USER || process.env.PGUSER || "stow",
      password: process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }

  if (process.env.DATABASE_URL) {
    const connectionString = process.env.DATABASE_URL.replace(/^postgresql\+asyncpg:\/\//, "postgresql://");
    return new Pool({ connectionString, max: 10, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5_000 });
  }

  return null;
}

const pool = createPool();
let databaseReady = false;

const schema = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    handle TEXT NOT NULL UNIQUE,
    gmail TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    terms_accepted_at TIMESTAMPTZ NOT NULL,
    privacy_accepted_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_agent TEXT,
    ip_address TEXT
  );
  CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

  CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('clip', 'note', 'link', 'code')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    device TEXT NOT NULL DEFAULT '此裝置',
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    collection TEXT NOT NULL DEFAULT 'work',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS items_owner_updated_idx ON items(owner_id, updated_at DESC);

  CREATE TABLE IF NOT EXISTS shares (
    token_hash TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    access_type TEXT NOT NULL CHECK (access_type IN ('recipient', 'link')),
    recipient_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
  );
  CREATE INDEX IF NOT EXISTS shares_item_id_idx ON shares(item_id);
  CREATE INDEX IF NOT EXISTS shares_recipient_idx ON shares(recipient_user_id);

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS password_reset_expires_at_idx ON password_reset_tokens(expires_at);
`;

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function requireDatabase() {
  if (!pool || !databaseReady) throw new ApiError(503, "DATABASE_UNAVAILABLE", "服務資料庫目前尚未就緒");
}

function nowPlusSeconds(seconds) {
  return new Date(Date.now() + seconds * 1000);
}

function digest(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function secureToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function normalizeHandle(value) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function normalizeGmail(value) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function validateHandle(handle) {
  if (!/^[a-z0-9][a-z0-9_-]{2,31}$/.test(handle)) {
    throw new ApiError(400, "INVALID_HANDLE", "帳號名稱需為 3–32 個英數字、底線或連字號");
  }
}

function validateGmail(gmail) {
  if (!/^[^\s@]+@gmail\.com$/.test(gmail)) {
    throw new ApiError(400, "INVALID_GMAIL", "請輸入有效的 Gmail 帳號");
  }
}

function validatePassword(password) {
  if (typeof password !== "string" || password.length < 12 || password.length > 128) {
    throw new ApiError(400, "INVALID_PASSWORD", "密碼長度需為 12–128 個字元");
  }
}

function validateItemType(type) {
  if (!["clip", "note", "link", "code"].includes(type)) {
    throw new ApiError(400, "INVALID_ITEM", "內容類型不正確");
  }
}

function cleanTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((tag) => typeof tag === "string")
    .map((tag) => tag.trim().slice(0, 32))
    .filter(Boolean)
    .slice(0, 4);
}

function validateItemInput(input, partial = false) {
  const result = {};
  if (!partial || input.type !== undefined) {
    if (typeof input.type !== "string") throw new ApiError(400, "INVALID_ITEM", "內容類型不正確");
    validateItemType(input.type);
    result.type = input.type;
  }
  if (!partial || input.title !== undefined) {
    if (typeof input.title !== "string" || !input.title.trim() || input.title.length > 120) {
      throw new ApiError(400, "INVALID_ITEM", "標題不可為空且不得超過 120 個字元");
    }
    result.title = input.title.trim();
  }
  if (!partial || input.content !== undefined) {
    if (typeof input.content !== "string" || !input.content.trim() || input.content.length > maxContentLength) {
      throw new ApiError(400, "INVALID_ITEM", "內容不可為空或超過大小限制");
    }
    result.content = input.content.trim();
  }
  if (!partial || input.tags !== undefined) result.tags = cleanTags(input.tags);
  if (!partial || input.device !== undefined) {
    result.device = typeof input.device === "string" && input.device.trim() ? input.device.trim().slice(0, 80) : "此裝置";
  }
  if (!partial || input.collection !== undefined) {
    const collection = typeof input.collection === "string" ? input.collection : "work";
    result.collection = ["work", "personal", "read-later"].includes(collection) ? collection : "work";
  }
  if (input.pinned !== undefined) {
    if (typeof input.pinned !== "boolean") throw new ApiError(400, "INVALID_ITEM", "釘選狀態不正確");
    result.pinned = input.pinned;
  }
  return result;
}

function parseCookies(header) {
  return Object.fromEntries((header || "").split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const index = part.indexOf("=");
    return index < 0 ? [part, ""] : [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
  }));
}

function cookieFlags({ httpOnly = false, sameSite = "Lax", maxAge } = {}) {
  return [
    "Path=/",
    ...(maxAge === undefined ? [] : [`Max-Age=${maxAge}`]),
    ...(httpOnly ? ["HttpOnly"] : []),
    `SameSite=${sameSite}`,
    ...(isProduction ? ["Secure"] : []),
  ].join("; ");
}

function setSessionCookie(res, token) {
  res.setHeader("Set-Cookie", `${sessionCookieName}=${encodeURIComponent(token)}; ${cookieFlags({ httpOnly: true, maxAge: sessionMaxAge })}`);
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${sessionCookieName}=; ${cookieFlags({ httpOnly: true, maxAge: 0 })}`);
}

function setCsrfCookie(res, token) {
  res.setHeader("Set-Cookie", `${csrfCookieName}=${encodeURIComponent(token)}; ${cookieFlags({ sameSite: "Strict", maxAge: sessionMaxAge })}`);
}

function safeCompare(left, right) {
  if (!left || !right) return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function userView(row) {
  return { id: row.id, handle: row.handle, gmail: row.gmail };
}

function formatTimeLabel(value) {
  const age = Math.max(0, Date.now() - new Date(value).getTime());
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (age < minute) return "剛剛";
  if (age < hour) return `${Math.floor(age / minute)} 分鐘前`;
  if (age < day) return `${Math.floor(age / hour)} 小時前`;
  if (age < 7 * day) return `${Math.floor(age / day)} 天前`;
  return new Intl.DateTimeFormat("zh-TW", { month: "short", day: "numeric" }).format(new Date(value));
}

function itemView(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    content: row.content,
    tags: Array.isArray(row.tags) ? row.tags : [],
    device: row.device,
    timeLabel: formatTimeLabel(row.updated_at),
    updatedAt: new Date(row.updated_at).getTime(),
    pinned: row.pinned,
    collection: row.collection,
  };
}

function clientAddress(req) {
  return String(req.ip || "").slice(0, 128);
}

async function findUserBySession(req) {
  requireDatabase();
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[sessionCookieName];
  if (!token) return null;
  const result = await pool.query(
    `SELECT u.id, u.handle, u.gmail, s.token_hash, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
    [digest(token)],
  );
  const row = result.rows[0];
  if (!row) return null;
  await pool.query("UPDATE sessions SET last_seen_at = NOW() WHERE token_hash = $1", [row.token_hash]);
  return { ...userView(row), tokenHash: row.token_hash };
}

async function requireUser(req, _res, next) {
  try {
    const user = await findUserBySession(req);
    if (!user) throw new ApiError(401, "AUTH_REQUIRED", "請先登入");
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

async function issueSession(client, userId, req, res) {
  const token = secureToken();
  await client.query(
    `INSERT INTO sessions (token_hash, user_id, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [digest(token), userId, nowPlusSeconds(sessionMaxAge), String(req.get("user-agent") || "").slice(0, 512), clientAddress(req)],
  );
  setSessionCookie(res, token);
}

function requestOrigin(req) {
  const configured = process.env.APP_BASE_URL;
  if (configured) return new URL(configured);
  return new URL(`${req.protocol}://${req.get("host")}/`);
}

function shareURL(req, token) {
  const url = requestOrigin(req);
  url.search = `?share=${encodeURIComponent(token)}`;
  url.hash = "";
  return url.toString();
}

let mailTransporter = null;
if (process.env.SMTP_URL) {
  mailTransporter = nodemailer.createTransport(process.env.SMTP_URL, {
    disableFileAccess: true,
    disableUrlAccess: true,
  });
} else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
  mailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || "true").toLowerCase() === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    disableFileAccess: true,
    disableUrlAccess: true,
  });
}

async function sendPasswordResetEmail(req, gmail, token) {
  const url = shareURL(req, token).replace("?share=", "?reset=");
  if (!mailTransporter) {
    if (isProduction) throw new ApiError(503, "RESET_UNAVAILABLE", "密碼重設信件服務尚未設定");
    console.info(`[STOW development] password reset URL for ${gmail}: ${url}`);
    return;
  }
  await mailTransporter.sendMail({
    from: process.env.SMTP_FROM || "STOW <no-reply@localhost>",
    to: gmail,
    subject: "STOW 密碼重設連結",
    text: `有人要求重設你的 STOW 密碼。連結將在一小時後失效：\n\n${url}\n\n如果不是你本人操作，請忽略這封信。`,
  });
}

function csrfRequired(req, _res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const cookies = parseCookies(req.headers.cookie);
  if (!safeCompare(cookies[csrfCookieName], req.get("x-csrf-token"))) {
    return next(new ApiError(403, "CSRF_INVALID", "安全驗證已失效，請重新整理頁面"));
  }
  return next();
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { code: "RATE_LIMITED", message: "嘗試次數過多，請稍後再試" },
});

app.get("/api/health", (_req, res) => {
  res.status(databaseReady ? 200 : 503).json({
    ok: databaseReady,
    database: databaseReady ? "ready" : "unavailable",
    mail: mailTransporter ? "configured" : "unavailable",
  });
});

app.use("/api", csrfRequired);

app.get("/api/csrf", (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[csrfCookieName] || secureToken();
  if (!cookies[csrfCookieName]) setCsrfCookie(res, token);
  res.json({ csrfToken: token });
});

app.get("/api/me", async (req, res, next) => {
  try {
    const user = await findUserBySession(req);
    res.json({ authenticated: Boolean(user), user: user ? userView(user) : null });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/register", authLimiter, async (req, res, next) => {
  try {
    requireDatabase();
    const handle = normalizeHandle(req.body?.handle);
    const gmail = normalizeGmail(req.body?.gmail);
    const password = req.body?.password;
    validateHandle(handle);
    validateGmail(gmail);
    validatePassword(password);
    if (req.body?.termsAccepted !== true || req.body?.privacyAccepted !== true) {
      throw new ApiError(400, "LEGAL_REQUIRED", "請先同意服務條款與隱私政策");
    }
    const passwordHash = await bcrypt.hash(password, passwordRounds);
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO users (id, handle, gmail, password_hash, terms_accepted_at, privacy_accepted_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [id, handle, gmail, passwordHash],
    );
    res.status(201).json({ ok: true, message: "帳號已建立，請登入" });
  } catch (error) {
    if (error?.code === "23505") {
      const constraint = String(error.constraint || "");
      return next(new ApiError(409, constraint.includes("gmail") ? "GMAIL_TAKEN" : "HANDLE_TAKEN", "帳號名稱或 Gmail 已被使用"));
    }
    return next(error);
  }
});

app.post("/api/auth/login", authLimiter, async (req, res, next) => {
  try {
    requireDatabase();
    const handle = normalizeHandle(req.body?.handle);
    const password = req.body?.password;
    validateHandle(handle);
    validatePassword(password);
    const result = await pool.query("SELECT * FROM users WHERE handle = $1", [handle]);
    const user = result.rows[0];
    const valid = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!valid) throw new ApiError(401, "INVALID_CREDENTIALS", "帳號名稱或密碼不正確");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await issueSession(client, user.id, req, res);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    res.json({ ok: true, user: userView(user) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/logout", async (req, res, next) => {
  try {
    requireDatabase();
    const cookies = parseCookies(req.headers.cookie);
    if (cookies[sessionCookieName]) await pool.query("DELETE FROM sessions WHERE token_hash = $1", [digest(cookies[sessionCookieName])]);
    clearSessionCookie(res);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/password-reset/request", authLimiter, async (req, res, next) => {
  try {
    requireDatabase();
    const gmail = normalizeGmail(req.body?.gmail);
    validateGmail(gmail);
    const result = await pool.query("SELECT id FROM users WHERE gmail = $1", [gmail]);
    if (result.rows[0]) {
      const token = secureToken();
      await pool.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [result.rows[0].id]);
      await pool.query(
        `INSERT INTO password_reset_tokens (token_hash, user_id, expires_at)
         VALUES ($1, $2, $3)`,
        [digest(token), result.rows[0].id, nowPlusSeconds(passwordResetMaxAge)],
      );
      await sendPasswordResetEmail(req, gmail, token);
    }
    res.status(202).json({ ok: true, message: "如果帳號存在，重設密碼連結已寄出" });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/password-reset/confirm", authLimiter, async (req, res, next) => {
  try {
    requireDatabase();
    const token = typeof req.body?.token === "string" ? req.body.token : "";
    const password = req.body?.password;
    validatePassword(password);
    if (!token || token.length < 32) throw new ApiError(400, "RESET_INVALID", "重設密碼連結無效或已過期");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        `SELECT user_id FROM password_reset_tokens
          WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
          FOR UPDATE`,
        [digest(token)],
      );
      const reset = result.rows[0];
      if (!reset) throw new ApiError(400, "RESET_INVALID", "重設密碼連結無效或已過期");
      const passwordHash = await bcrypt.hash(password, passwordRounds);
      await client.query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [passwordHash, reset.user_id]);
      await client.query("UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = $1", [digest(token)]);
      await client.query("DELETE FROM sessions WHERE user_id = $1", [reset.user_id]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    res.json({ ok: true, message: "密碼已重設，請重新登入" });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/me", requireUser, async (req, res, next) => {
  try {
    const gmail = normalizeGmail(req.body?.gmail);
    validateGmail(gmail);
    const result = await pool.query("UPDATE users SET gmail = $1, updated_at = NOW() WHERE id = $2 RETURNING id, handle, gmail", [gmail, req.user.id]);
    res.json({ ok: true, user: userView(result.rows[0]) });
  } catch (error) {
    if (error?.code === "23505") return next(new ApiError(409, "GMAIL_TAKEN", "這個 Gmail 已被其他帳號使用"));
    return next(error);
  }
});

app.patch("/api/me/password", requireUser, async (req, res, next) => {
  try {
    const currentPassword = req.body?.currentPassword;
    const newPassword = req.body?.newPassword;
    validatePassword(currentPassword);
    validatePassword(newPassword);
    if (currentPassword === newPassword) throw new ApiError(400, "PASSWORD_UNCHANGED", "新密碼不能與目前密碼相同");
    const userResult = await pool.query("SELECT password_hash FROM users WHERE id = $1", [req.user.id]);
    if (!userResult.rows[0] || !(await bcrypt.compare(currentPassword, userResult.rows[0].password_hash))) {
      throw new ApiError(401, "CURRENT_PASSWORD_INVALID", "目前密碼不正確");
    }
    const passwordHash = await bcrypt.hash(newPassword, passwordRounds);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [passwordHash, req.user.id]);
      await client.query("DELETE FROM sessions WHERE user_id = $1", [req.user.id]);
      await issueSession(client, req.user.id, req, res);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    res.json({ ok: true, message: "密碼已更新" });
  } catch (error) {
    next(error);
  }
});

app.get("/api/items", requireUser, async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM items WHERE owner_id = $1 ORDER BY updated_at DESC", [req.user.id]);
    res.json({ items: result.rows.map(itemView) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/items", requireUser, async (req, res, next) => {
  try {
    const input = validateItemInput(req.body || {});
    const id = crypto.randomUUID();
    const result = await pool.query(
      `INSERT INTO items (id, owner_id, type, title, content, tags, device, pinned, collection)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9)
       RETURNING *`,
      [id, req.user.id, input.type, input.title, input.content, JSON.stringify(input.tags), input.device, input.pinned ?? false, input.collection],
    );
    res.status(201).json({ item: itemView(result.rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/items/:id", requireUser, async (req, res, next) => {
  try {
    const input = validateItemInput(req.body || {}, true);
    const fields = [];
    const values = [];
    const add = (column, value, cast = "") => {
      fields.push(`${column} = $${values.length + 1}${cast}`);
      values.push(value);
    };
    if (input.type !== undefined) add("type", input.type);
    if (input.title !== undefined) add("title", input.title);
    if (input.content !== undefined) add("content", input.content);
    if (input.tags !== undefined) add("tags", JSON.stringify(input.tags), "::jsonb");
    if (input.device !== undefined) add("device", input.device);
    if (input.collection !== undefined) add("collection", input.collection);
    if (input.pinned !== undefined) add("pinned", input.pinned);
    if (!fields.length) throw new ApiError(400, "INVALID_ITEM", "沒有可更新的內容");
    fields.push("updated_at = NOW()");
    values.push(req.params.id, req.user.id);
    const result = await pool.query(
      `UPDATE items SET ${fields.join(", ")} WHERE id = $${values.length - 1} AND owner_id = $${values.length} RETURNING *`,
      values,
    );
    if (!result.rows[0]) throw new ApiError(404, "ITEM_NOT_FOUND", "找不到這則內容");
    res.json({ item: itemView(result.rows[0]) });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/items/:id", requireUser, async (req, res, next) => {
  try {
    const result = await pool.query("DELETE FROM items WHERE id = $1 AND owner_id = $2 RETURNING id", [req.params.id, req.user.id]);
    if (!result.rows[0]) throw new ApiError(404, "ITEM_NOT_FOUND", "找不到這則內容");
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/shares", requireUser, async (req, res, next) => {
  try {
    const itemId = typeof req.body?.itemId === "string" ? req.body.itemId : "";
    const access = req.body?.access === "link" ? "link" : "recipient";
    const itemResult = await pool.query("SELECT id FROM items WHERE id = $1 AND owner_id = $2", [itemId, req.user.id]);
    if (!itemResult.rows[0]) throw new ApiError(404, "ITEM_NOT_FOUND", "找不到這則內容");
    let recipientUserId = null;
    if (access === "recipient") {
      const recipientHandle = normalizeHandle(req.body?.recipientHandle);
      validateHandle(recipientHandle);
      const recipientResult = await pool.query("SELECT id FROM users WHERE handle = $1", [recipientHandle]);
      if (!recipientResult.rows[0]) throw new ApiError(404, "RECIPIENT_NOT_FOUND", "找不到指定的帳號");
      recipientUserId = recipientResult.rows[0].id;
    }
    const token = secureToken();
    await pool.query(
      `INSERT INTO shares (token_hash, owner_id, item_id, access_type, recipient_user_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [digest(token), req.user.id, itemId, access, recipientUserId],
    );
    res.status(201).json({ access, url: shareURL(req, token), token });
  } catch (error) {
    next(error);
  }
});

app.get("/api/shares/:token", async (req, res, next) => {
  try {
    requireDatabase();
    const token = String(req.params.token || "");
    const result = await pool.query(
      `SELECT s.access_type, s.recipient_user_id, i.*
         FROM shares s JOIN items i ON i.id = s.item_id
        WHERE s.token_hash = $1 AND s.revoked_at IS NULL`,
      [digest(token)],
    );
    const share = result.rows[0];
    if (!share) throw new ApiError(404, "SHARE_NOT_FOUND", "這條分享連結不存在或已撤銷");
    const user = await findUserBySession(req);
    const metadata = { access: share.access_type, title: share.title };
    if (share.access_type === "recipient") {
      if (!user) return res.status(401).json({ code: "AUTH_REQUIRED", ...metadata });
      if (user.id !== share.recipient_user_id) throw new ApiError(403, "SHARE_FORBIDDEN", "你沒有權限查看這則內容");
    }
    return res.json({ ...metadata, item: itemView(share) });
  } catch (error) {
    return next(error);
  }
});

app.delete("/api/shares/:token", requireUser, async (req, res, next) => {
  try {
    const result = await pool.query(
      "UPDATE shares SET revoked_at = NOW() WHERE token_hash = $1 AND owner_id = $2 AND revoked_at IS NULL RETURNING token_hash",
      [digest(String(req.params.token || "")), req.user.id],
    );
    if (!result.rows[0]) throw new ApiError(404, "SHARE_NOT_FOUND", "找不到可撤銷的分享連結");
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.use("/api", (_req, _res, next) => next(new ApiError(404, "NOT_FOUND", "找不到 API 路徑")));

app.use((error, _req, res, _next) => {
  if (error?.type === "entity.too.large") return res.status(413).json({ code: "PAYLOAD_TOO_LARGE", message: "送出的資料太大" });
  const status = Number(error?.status) || 500;
  const code = error?.code || "SERVER_ERROR";
  if (status >= 500) console.error("STOW request failed", error);
  return res.status(status).json({ code, message: status >= 500 ? "服務暫時無法完成要求" : error.message });
});

async function sendAuthEntryPage(req, res, next) {
  try {
    const indexPath = path.join(publicRoot, "index.html");
    const source = await readFile(indexPath, "utf8");
    const html = source.replace(
      '<dialog class="auth-dialog" id="authDialog"',
      '<dialog class="auth-dialog" id="authDialog" open',
    );
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.type("html").send(html);
  } catch (error) {
    next(error);
  }
}

app.get(["/login", "/register"], sendAuthEntryPage);

app.use(express.static(publicRoot, {
  index: "index.html",
  maxAge: isProduction ? "1h" : 0,
  setHeaders(res, filePath) {
    if (path.extname(filePath) === ".html") {
      res.setHeader("Cache-Control", "no-store, max-age=0");
    }
  },
}));
app.get("*", (_req, res) => res.sendFile(path.join(publicRoot, "index.html")));

async function initialize() {
  if (pool) {
    try {
      await pool.query(schema);
      databaseReady = true;
      console.log("STOW database ready");
    } catch (error) {
      console.error("STOW database initialization failed", error);
      if (isProduction) process.exit(1);
    }
  } else {
    console.warn("STOW started without DATABASE_URL or PostgreSQL settings; account APIs are disabled");
  }
  app.listen(port, host, () => console.log(`STOW listening on ${host}:${port}`));
}

initialize();
