"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isLangCode } from "@/lib/i18n/languages";
import { getCurrentUser, requireUser } from "@/server/auth/dal";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { createSession, destroyAllSessions, destroySession } from "@/server/auth/session";
import { db, schema } from "@/server/db/client";
import { LANG_COOKIE } from "@/server/i18n";
import { clientIp, rateLimit, resetRateLimit } from "@/server/rateLimit";

export type FormState = { error?: string; ok?: boolean } | undefined;

export async function startAsGuest() {
  const existing = await getCurrentUser();
  if (existing) redirect(existing.profile?.onboardingCompletedAt ? "/home" : "/onboarding");
  const ip = await clientIp();
  if (!(await rateLimit(`guest:${ip}`, 30, 3600))) redirect("/?error=rate");
  const id = randomUUID();
  await db.insert(schema.users).values({ id, isGuest: true, lastActiveAt: new Date() });
  const lang = (await cookies()).get(LANG_COOKIE)?.value;
  await db.insert(schema.profiles).values({ userId: id, language: isLangCode(lang) ? lang : "en" });
  await createSession(id);
  redirect("/onboarding");
}

const Credentials = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
});

export async function logIn(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = Credentials.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: "auth.invalid" };
  const { email, password } = parsed.data;
  const ip = await clientIp();
  const okIp = await rateLimit(`login-ip:${ip}`, 20, 900);
  const okEmail = await rateLimit(`login-email:${email}`, 8, 900);
  if (!okIp || !okEmail) return { error: "auth.rateLimited" };
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  // Always run a hash comparison so response time doesn't reveal whether the email exists.
  const valid = user?.passwordHash
    ? await verifyPassword(password, user.passwordHash)
    : (await verifyPassword(password, "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$" + "A".repeat(86)), false);
  if (!user || !valid) return { error: "auth.invalid" };
  await resetRateLimit(`login-email:${email}`);
  await db.update(schema.users).set({ lastActiveAt: new Date() }).where(eq(schema.users.id, user.id));
  await createSession(user.id);
  redirect("/home");
}

const SecureInput = z.object({
  email: z.string().trim().toLowerCase().email("auth.invalidEmail").max(200),
  password: z.string().min(10, "auth.weakPassword").max(200),
  displayName: z.string().trim().max(60).optional(),
});

export async function secureAccount(_prev: FormState, form: FormData): Promise<FormState> {
  const { user } = await requireUser();
  const parsed = SecureInput.safeParse({
    email: form.get("email"),
    password: form.get("password"),
    displayName: form.get("displayName") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "common.error" };
  if (!(await rateLimit(`secure:${user.id}`, 10, 3600))) return { error: "auth.rateLimited" };
  const [taken] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, parsed.data.email)).limit(1);
  if (taken && taken.id !== user.id) return { error: "auth.emailTaken" };
  await db
    .update(schema.users)
    .set({
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      isGuest: false,
      ...(parsed.data.displayName ? { displayName: parsed.data.displayName } : {}),
    })
    .where(eq(schema.users.id, user.id));
  // Changing credentials signs out other devices.
  await destroyAllSessions(user.id);
  await createSession(user.id);
  return { ok: true };
}

export async function logOut() {
  await destroySession();
  redirect("/");
}

export async function setLanguage(lang: string) {
  if (!isLangCode(lang)) return;
  (await cookies()).set(LANG_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  const current = await getCurrentUser();
  if (current)
    await db
      .insert(schema.profiles)
      .values({ userId: current.user.id, language: lang })
      .onConflictDoUpdate({ target: schema.profiles.userId, set: { language: lang, updatedAt: new Date() } });
}
