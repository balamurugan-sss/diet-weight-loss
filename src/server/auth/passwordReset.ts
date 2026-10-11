import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { after } from "next/server";
import { config } from "@/server/config";
import { db, schema } from "@/server/db/client";
import { escapeHtml, sendEmail } from "@/server/email";
import { getI18n } from "@/server/i18n";

export const RESET_MINUTES = 60;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Issues a fresh reset token for the user; any earlier links stop working. */
export async function createResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db.delete(schema.passwordResets).where(eq(schema.passwordResets.userId, userId));
  await db.insert(schema.passwordResets).values({ id: hashToken(token), userId, expiresAt: new Date(Date.now() + RESET_MINUTES * 60_000) });
  return token;
}

/** The user a token belongs to, if it is unused and not expired. */
export async function findReset(token: string): Promise<{ id: string; userId: string } | null> {
  if (!token || token.length > 128) return null;
  const [row] = await db
    .select({ id: schema.passwordResets.id, userId: schema.passwordResets.userId })
    .from(schema.passwordResets)
    .where(and(eq(schema.passwordResets.id, hashToken(token)), isNull(schema.passwordResets.usedAt), gt(schema.passwordResets.expiresAt, new Date())))
    .limit(1);
  return row ?? null;
}

/** Marks the token used; returns false if another request used it first. */
export async function consumeReset(id: string): Promise<boolean> {
  const res = await db
    .update(schema.passwordResets)
    .set({ usedAt: new Date() })
    .where(and(eq(schema.passwordResets.id, id), isNull(schema.passwordResets.usedAt)));
  return res.rowsAffected === 1;
}

/**
 * Emails a fresh reset link to the account's own address. Sent after the
 * response so timing doesn't reveal whether the account exists.
 */
export async function sendResetEmail(userId: string, email: string) {
  const token = await createResetToken(userId);
  const link = `${config.appUrl}/reset-password?token=${token}`;
  const { t } = await getI18n();
  const body = t("auth.resetEmailBody", { minutes: RESET_MINUTES });
  const ignore = t("auth.resetEmailIgnore");
  after(() =>
    sendEmail({
      to: email,
      subject: t("auth.resetEmailSubject"),
      text: `${body}\n\n${link}\n\n${ignore}`,
      html: `<p>${escapeHtml(body)}</p><p><a href="${escapeHtml(link)}">${escapeHtml(t("auth.resetTitle"))}</a></p><p style="color:#666">${escapeHtml(ignore)}</p>`,
    }),
  );
}
