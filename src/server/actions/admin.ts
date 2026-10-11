"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/server/admin";
import { sendResetEmail } from "@/server/auth/passwordReset";
import { destroyAllSessions } from "@/server/auth/session";
import { db, schema } from "@/server/db/client";
import { grantPremium, logAdmin, revokePremium } from "@/server/services/admin";
import { safeLink } from "@/lib/admin/rules";
import { deliver } from "@/server/services/announcements";

type Result = { ok: true; message?: string } | { ok: false; error: string };
export type AdminFormState = { ok?: boolean; error?: string; message?: string; at?: number } | undefined;

const Id = z.string().min(1).max(64);
const Months = z.union([z.literal(1), z.literal(3), z.literal(6), z.literal(12), z.null()]);
const fmtMonths = (m: number | null) => (m == null ? "no end date" : `${m} month${m === 1 ? "" : "s"}`);

async function target(id: unknown) {
  const parsed = Id.safeParse(id);
  if (!parsed.success) return null;
  const [u] = await db.select({ id: schema.users.id, email: schema.users.email, isGuest: schema.users.isGuest }).from(schema.users).where(eq(schema.users.id, parsed.data)).limit(1);
  return u && !u.isGuest ? u : null;
}

function refresh(userId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  if (userId) revalidatePath(`/admin/users/${userId}`);
}

export async function grantPremiumAction(userId: unknown, months: unknown): Promise<Result> {
  const { user: admin } = await requireAdmin();
  const u = await target(userId);
  const m = Months.safeParse(months);
  if (!u || !m.success) return { ok: false, error: "common.error" };
  const until = await grantPremium(u.id, m.data);
  await logAdmin(admin.email!, "premium.grant", u.id, `${fmtMonths(m.data)}${until ? ` (until ${until.toISOString().slice(0, 10)})` : ""}`);
  refresh(u.id);
  return { ok: true };
}

export async function revokePremiumAction(userId: unknown): Promise<Result> {
  const { user: admin } = await requireAdmin();
  const u = await target(userId);
  if (!u) return { ok: false, error: "common.error" };
  await revokePremium(u.id);
  await logAdmin(admin.email!, "premium.revoke", u.id);
  refresh(u.id);
  return { ok: true };
}

/** Emails the person their own reset link. The admin never sees the link or the password. */
export async function sendResetLinkAction(userId: unknown): Promise<Result> {
  const { user: admin } = await requireAdmin();
  const u = await target(userId);
  if (!u?.email) return { ok: false, error: "common.error" };
  await sendResetEmail(u.id, u.email);
  await logAdmin(admin.email!, "password.reset_link", u.id);
  refresh(u.id);
  return { ok: true };
}

export async function signOutEverywhereAction(userId: unknown): Promise<Result> {
  const { user: admin } = await requireAdmin();
  const u = await target(userId);
  if (!u) return { ok: false, error: "common.error" };
  await destroyAllSessions(u.id);
  await logAdmin(admin.email!, "sessions.sign_out_all", u.id);
  refresh(u.id);
  return { ok: true };
}

const Invite = z.object({
  email: z.string().trim().toLowerCase().email("auth.invalidEmail").max(200),
  months: z.enum(["1", "3", "6", "12", "none"]),
});

/** Premium by email: applied now if the account exists, otherwise when that email signs up. */
export async function invitePremiumAction(_prev: AdminFormState, form: FormData): Promise<AdminFormState> {
  const { user: admin } = await requireAdmin();
  const parsed = Invite.safeParse({ email: form.get("email"), months: form.get("months") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "common.error" };
  const months = parsed.data.months === "none" ? null : Number(parsed.data.months);
  const [u] = await db.select({ id: schema.users.id, isGuest: schema.users.isGuest }).from(schema.users).where(eq(schema.users.email, parsed.data.email)).limit(1);
  if (u && !u.isGuest) {
    await grantPremium(u.id, months);
    await logAdmin(admin.email!, "premium.grant", u.id, fmtMonths(months));
    refresh(u.id);
    return { ok: true, message: "admin.invite.granted" };
  }
  await db
    .insert(schema.premiumInvites)
    .values({ email: parsed.data.email, months, grantedBy: admin.email! })
    .onConflictDoUpdate({ target: schema.premiumInvites.email, set: { months, grantedBy: admin.email!, createdAt: new Date() } });
  await logAdmin(admin.email!, "premium.invite", null, fmtMonths(months));
  refresh();
  return { ok: true, message: "admin.invite.saved" };
}

export async function deleteInviteAction(email: unknown): Promise<Result> {
  const { user: admin } = await requireAdmin();
  const e = z.string().email().max(200).safeParse(email);
  if (!e.success) return { ok: false, error: "common.error" };
  await db.delete(schema.premiumInvites).where(eq(schema.premiumInvites.email, e.data));
  await logAdmin(admin.email!, "premium.invite_cancel", null);
  refresh();
  return { ok: true };
}

const Message = z
  .object({
    title: z.string().trim().min(1, "admin.msg.titleRequired").max(80),
    body: z.string().trim().min(1, "admin.msg.bodyRequired").max(300),
    link: z.string().trim().max(500).optional(),
    audience: z.enum(["all", "free", "premium"]),
    inApp: z.boolean(),
    push: z.boolean(),
    email: z.boolean(),
  })
  .refine((v) => v.inApp || v.push || v.email, { message: "admin.msg.channelRequired" });

/**
 * Saves a message and sends it. Email goes only to people who turned on
 * offers by email; push only to devices that allowed notifications.
 */
export async function sendAnnouncementAction(_prev: AdminFormState, form: FormData): Promise<AdminFormState> {
  const { user: admin } = await requireAdmin();
  const parsed = Message.safeParse({
    title: form.get("title"),
    body: form.get("body"),
    link: form.get("link") || undefined,
    audience: form.get("audience"),
    inApp: form.get("inApp") === "on",
    push: form.get("push") === "on",
    email: form.get("email") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "common.error" };
  const link = safeLink(parsed.data.link);
  if (parsed.data.link && !link) return { error: "admin.msg.badLink" };
  const [row] = await db
    .insert(schema.announcements)
    .values({ id: randomUUID(), ...parsed.data, link, createdBy: admin.email! })
    .returning();
  await logAdmin(admin.email!, "message.send", null, `${row.title} → ${row.audience}`);
  if (row.push || row.email) after(() => deliver(row));
  revalidatePath("/admin/messages");
  return { ok: true, message: "admin.msg.sent", at: Date.now() };
}

export async function deleteAnnouncementAction(id: unknown): Promise<Result> {
  const { user: admin } = await requireAdmin();
  const parsed = Id.safeParse(id);
  if (!parsed.success) return { ok: false, error: "common.error" };
  await db.delete(schema.announcements).where(eq(schema.announcements.id, parsed.data));
  await logAdmin(admin.email!, "message.delete", null);
  revalidatePath("/admin/messages");
  revalidatePath("/home");
  return { ok: true };
}
