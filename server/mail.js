import { readFile } from "node:fs/promises";
import path from "node:path";

import nodemailer from "nodemailer";

import { ApiError } from "./errors.js";

export function createMailTransporter() {
  const transportOptions = {
    disableFileAccess: true,
    disableUrlAccess: true,
  };

  if (process.env.SMTP_URL) {
    return nodemailer.createTransport(process.env.SMTP_URL, transportOptions);
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_SECURE || "true").toLowerCase() === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      ...transportOptions,
    });
  }

  return null;
}

function escapeEmailHTML(value) {
  return String(value ?? "").replace(/[&<>\"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;",
  })[character]);
}

function passwordResetEmailHTML(url) {
  const safeUrl = escapeEmailHTML(url);
  return `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <title>重設你的 STOW 密碼</title>
  </head>
  <body style="margin:0;padding:0;background:#ebe7df;color:#26383b;font-family:Arial,'Noto Sans TC','Microsoft JhengHei',sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#ebe7df;">
      <tr>
        <td align="center" style="padding:32px 14px;">
          <table role="presentation" width="620" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:620px;background:#fffdfa;border:1px solid #d8d3c8;">
            <tr>
              <td style="background:#26383b;">
                <img src="cid:stow-reset-bg@stow" width="620" alt="" style="display:block;width:100%;max-width:620px;height:auto;border:0;" />
              </td>
            </tr>
            <tr>
              <td style="padding:30px 36px 34px;">
                <p style="margin:0 0 10px;color:#d94f43;font-size:11px;line-height:1.4;letter-spacing:2px;">STOW / ACCOUNT RECOVERY</p>
                <h1 style="margin:0;color:#1e282a;font-size:30px;font-weight:500;line-height:1.25;">找回你的密碼</h1>
                <p style="margin:18px 0 0;color:#586463;font-size:15px;line-height:1.8;">有人要求重設你的 STOW 密碼。點擊下面的按鈕設定新密碼，這條連結只會使用一次。</p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 0;">
                  <tr>
                    <td style="border-radius:2px;background:#d94f43;">
                      <a href="${safeUrl}" style="display:inline-block;padding:13px 20px;color:#ffffff;font-size:14px;font-weight:700;line-height:1;text-decoration:none;">設定新的密碼&nbsp;&nbsp;→</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0;padding:14px 16px;border-left:3px solid #d9a149;background:#f4f0e8;color:#6d756f;font-size:12px;line-height:1.7;">安全提醒：連結將在一小時後失效。如果不是你本人要求，請忽略這封信。</p>
                <p style="margin:24px 0 0;color:#8b918b;font-size:11px;line-height:1.7;">如果按鈕無法使用，請將以下網址貼到瀏覽器：<br /><a href="${safeUrl}" style="color:#b65b4d;word-break:break-all;">${safeUrl}</a></p>
              </td>
            </tr>
            <tr>
              <td style="padding:17px 36px;background:#26383b;color:#dfe6df;font-size:10px;line-height:1.6;letter-spacing:1px;">STOW · PRIVATE BY DEFAULT<br /><span style="color:#9eaaa2;letter-spacing:0;">把想留住的東西，帶到每一台裝置。</span></td>
            </tr>
          </table>
          <p style="margin:16px 0 0;color:#8d938c;font-size:10px;line-height:1.6;">這是系統自動寄出的郵件，請勿直接回覆。</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendPasswordResetEmail({ transporter, gmail, url, isProduction, publicRoot }) {
  if (!transporter) {
    if (isProduction) throw new ApiError(503, "RESET_UNAVAILABLE", "密碼重設信件服務尚未設定");
    console.info(`[STOW development] password reset URL for ${gmail}: ${url}`);
    return;
  }

  const resetEmailImage = await readFile(path.join(publicRoot, "assets", "email-reset-bg.png"));
  await transporter.sendMail({
    from: process.env.SMTP_FROM || "STOW <no-reply@localhost>",
    to: gmail,
    subject: "重設你的 STOW 密碼",
    text: `有人要求重設你的 STOW 密碼。連結將在一小時後失效：\n\n${url}\n\n如果不是你本人操作，請忽略這封信。`,
    html: passwordResetEmailHTML(url),
    attachments: [{
      filename: "stow-reset-background.png",
      content: resetEmailImage,
      cid: "stow-reset-bg@stow",
      contentDisposition: "inline",
    }],
  });
}
