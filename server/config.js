import path from "node:path";
import { fileURLToPath } from "node:url";

const serverRoot = path.dirname(fileURLToPath(import.meta.url));

function resolveTrustProxy() {
  if (process.env.TRUST_PROXY === "false") return false;
  if (process.env.TRUST_PROXY === "true") return 1;
  return process.env.NODE_ENV === "production" ? 1 : false;
}

export const config = Object.freeze({
  isProduction: process.env.NODE_ENV === "production",
  trustProxy: resolveTrustProxy(),
  port: Number(process.env.APP_PORT || process.env.PORT || 3000),
  host: process.env.APP_HOST || "0.0.0.0",
  // Session lifetime in seconds, configured in whole days via
  // SESSION_MAX_AGE_DAYS (minimum 1 day, defaults to 365 days / one year).
  sessionMaxAge: (() => {
    const days = Number.parseInt(process.env.SESSION_MAX_AGE_DAYS || "", 10);
    const validDays = Number.isInteger(days) && days >= 1 ? days : 365;
    return validDays * 24 * 60 * 60;
  })(),
  passwordResetMaxAge: 60 * 60,
  sessionCookieName: "stow_session",
  csrfCookieName: "stow_csrf",
  passwordRounds: 12,
  maxContentLength: 200_000,
  // Canonical public base URL. Set in production so generated links (e.g.
  // password reset) never trust an attacker-supplied Host header.
  appBaseUrl: (process.env.APP_BASE_URL || "").trim(),
  publicRoot: path.resolve(process.env.PUBLIC_ROOT || path.join(serverRoot, "..")),
});
