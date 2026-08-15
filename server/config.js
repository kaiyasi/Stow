import path from "node:path";
import { fileURLToPath } from "node:url";

const serverRoot = path.dirname(fileURLToPath(import.meta.url));

export const config = Object.freeze({
  isProduction: process.env.NODE_ENV === "production",
  port: Number(process.env.APP_PORT || process.env.PORT || 3000),
  host: process.env.APP_HOST || "0.0.0.0",
  sessionMaxAge: 60 * 60 * 24 * 365,
  passwordResetMaxAge: 60 * 60,
  sessionCookieName: "stow_session",
  csrfCookieName: "stow_csrf",
  passwordRounds: 12,
  maxContentLength: 200_000,
  publicRoot: path.resolve(process.env.PUBLIC_ROOT || path.join(serverRoot, "..")),
});
