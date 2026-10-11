import "server-only";
import { config } from "@/server/config";

export type Mail = { to: string; subject: string; text: string; html: string; headers?: Record<string, string> };

export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const emailConfigured = () => Boolean(config.email.resendKey);

async function resend(path: string, body: unknown): Promise<boolean> {
  try {
    const res = await fetch(`https://api.resend.com${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.email.resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) console.error(`[email] Resend responded ${res.status}`);
    return res.ok;
  } catch (e) {
    console.error("[email] send failed", e instanceof Error ? e.message : e);
    return false;
  }
}

const payload = (m: Mail) => ({ from: config.email.from, to: [m.to], subject: m.subject, text: m.text, html: m.html, ...(m.headers ? { headers: m.headers } : {}) });

/**
 * Sends one transactional email through Resend. Without `RESEND_API_KEY` the
 * message is printed to the server log in development (so reset links can be
 * tested locally) and dropped in production. Returns whether it was handed off.
 */
export async function sendEmail(mail: Mail): Promise<boolean> {
  if (!config.email.resendKey) {
    if (process.env.NODE_ENV !== "production") console.info(`[email] ${mail.subject}\n${mail.text}`);
    else console.warn("[email] RESEND_API_KEY is not set; email not sent");
    return false;
  }
  return resend("/emails", payload(mail));
}

/** Sends many emails, 100 per Resend batch call. Returns how many were handed off. */
export async function sendEmails(mails: Mail[]): Promise<number> {
  if (!config.email.resendKey) {
    if (process.env.NODE_ENV !== "production") console.info(`[email] ${mails.length} × ${mails[0]?.subject ?? ""} (not sent: no RESEND_API_KEY)`);
    return 0;
  }
  let sent = 0;
  for (let i = 0; i < mails.length; i += 100) {
    const chunk = mails.slice(i, i + 100);
    if (await resend("/emails/batch", chunk.map(payload))) sent += chunk.length;
  }
  return sent;
}
