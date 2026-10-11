"use client";

import { useActionState, useState, useTransition } from "react";
import { inputClass } from "@/components/auth/LoginForm";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import type { MessageKey } from "@/lib/i18n/messages/en";
import {
  deleteAnnouncementAction,
  deleteInviteAction,
  grantPremiumAction,
  invitePremiumAction,
  revokePremiumAction,
  sendAnnouncementAction,
  sendResetLinkAction,
  signOutEverywhereAction,
} from "@/server/actions/admin";

type Res = { ok: boolean; error?: string };

function Note({ ok, text }: { ok: boolean; text: string }) {
  return (
    <p role={ok ? "status" : "alert"} className={ok ? "rounded-md bg-sand px-3 py-2 text-sm text-ink-2" : "rounded-md bg-terracotta-100 px-3 py-2 text-sm text-terracotta"}>
      {text}
    </p>
  );
}

/** Runs an admin action, optionally after a confirm(), and shows what happened. */
function useRun() {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (fn: () => Promise<Res>, done: MessageKey, confirmKey?: MessageKey) => {
    if (confirmKey && !window.confirm(t(confirmKey))) return;
    start(async () => {
      const r = await fn();
      setNote(r.ok ? { ok: true, text: t(done) } : { ok: false, text: t((r.error ?? "common.error") as MessageKey) });
    });
  };
  return { pending, note, run };
}

const MONTHS = [
  { v: "1", k: "admin.invite.m1" },
  { v: "3", k: "admin.invite.m3" },
  { v: "6", k: "admin.invite.m6" },
  { v: "12", k: "admin.invite.m12" },
  { v: "none", k: "admin.invite.none" },
] as const;

export function InviteForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(invitePremiumAction, undefined);
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">{t("auth.email")}</span>
          <input name="email" type="email" required autoComplete="off" className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">{t("admin.invite.months")}</span>
          <select name="months" defaultValue="12" className={inputClass}>
            {MONTHS.map((m) => (
              <option key={m.v} value={m.v}>
                {t(m.k)}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="lime" size="lg" disabled={pending}>
          {t("admin.invite.submit")}
        </Button>
      </div>
      {state?.error && <Note ok={false} text={t(state.error as MessageKey)} />}
      {state?.ok && state.message && <Note ok text={t(state.message as MessageKey)} />}
    </form>
  );
}

export function CancelInviteButton({ email }: { email: string }) {
  const { t } = useI18n();
  const { pending, run } = useRun();
  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={() => run(() => deleteInviteAction(email), "admin.user.done")}>
      {t("admin.invite.cancel")}
    </Button>
  );
}

/** The help actions on one account. */
export function UserActions({ userId, isPremium, paidViaStripe }: { userId: string; isPremium: boolean; paidViaStripe: boolean }) {
  const { t } = useI18n();
  const { pending, note, run } = useRun();
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-bold">{t("admin.user.premium")}</p>
        <div className="flex flex-wrap gap-2">
          {([1, 3, 12] as const).map((m) => (
            <Button key={m} variant="lime" size="sm" disabled={pending} onClick={() => run(() => grantPremiumAction(userId, m), "admin.user.done")}>
              {t("admin.user.add", { m: t(`admin.invite.m${m}`) })}
            </Button>
          ))}
          <Button variant="outline" size="sm" disabled={pending} onClick={() => run(() => grantPremiumAction(userId, null), "admin.user.done")}>
            {t("admin.invite.none")}
          </Button>
          {isPremium && (
            <Button variant="danger" size="sm" disabled={pending} onClick={() => run(() => revokePremiumAction(userId), "admin.user.done", "admin.user.revokeConfirm")}>
              {t("admin.user.revoke")}
            </Button>
          )}
        </div>
        {paidViaStripe && <p className="mt-2 text-xs text-muted">{t("admin.user.stripeNote")}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={pending} onClick={() => run(() => sendResetLinkAction(userId), "admin.user.resetSent")}>
          {t("admin.user.reset")}
        </Button>
        <Button variant="outline" disabled={pending} onClick={() => run(() => signOutEverywhereAction(userId), "admin.user.signedOut", "admin.user.signOutConfirm")}>
          {t("admin.user.signOut")}
        </Button>
      </div>
      {note && <Note {...note} />}
    </div>
  );
}

type Counts = Record<"all" | "free" | "premium", { users: number; push: number; email: number }>;

export function MessageForm({ counts, pushOn, emailOn, inAppDays }: { counts: Counts; pushOn: boolean; emailOn: boolean; inAppDays: number }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(sendAnnouncementAction, undefined);
  const [audience, setAudience] = useState<keyof Counts>("all");
  const c = counts[audience];
  const check = "flex items-start gap-3 rounded-md bg-sand px-3 py-2.5 text-[15px]";
  return (
    <form action={action} key={state?.at ?? 0} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">{t("admin.msg.fTitle")}</span>
        <input name="title" required maxLength={80} className={inputClass} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">{t("admin.msg.fBody")}</span>
        <textarea name="body" required maxLength={300} rows={3} className={`${inputClass} h-auto py-3`} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">{t("admin.msg.fLink")}</span>
        <input name="link" maxLength={500} placeholder="/explore" aria-describedby="link-hint" className={inputClass} />
        <span id="link-hint" className="mt-1 block text-xs text-muted">
          {t("admin.msg.linkHint")}
        </span>
      </label>
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold">{t("admin.msg.audience")}</legend>
        <div className="flex flex-wrap gap-2">
          {(["all", "free", "premium"] as const).map((a) => (
            <label key={a} className="flex h-10 cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-sm has-checked:border-lime has-checked:bg-lime has-checked:text-on-accent">
              <input type="radio" name="audience" value={a} checked={audience === a} onChange={() => setAudience(a)} className="sr-only" />
              {t(`admin.msg.aud.${a}`)} · {t("admin.msg.reach", { n: counts[a].users })}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-sm font-semibold">{t("admin.msg.channels")}</legend>
        <label className={check}>
          <input type="checkbox" name="inApp" defaultChecked className="mt-1 size-4 accent-[var(--color-lime)]" />
          {t("admin.msg.inApp", { days: inAppDays })}
        </label>
        <label className={check}>
          <input type="checkbox" name="push" disabled={!pushOn} className="mt-1 size-4 accent-[var(--color-lime)]" />
          <span>
            {t("admin.msg.push", { n: c.push })}
            {!pushOn && <span className="block text-xs text-muted">{t("admin.msg.pushOff")}</span>}
          </span>
        </label>
        <label className={check}>
          <input type="checkbox" name="email" disabled={!emailOn} className="mt-1 size-4 accent-[var(--color-lime)]" />
          <span>
            {t("admin.msg.email", { n: c.email })}
            {!emailOn && <span className="block text-xs text-muted">{t("admin.msg.emailOff")}</span>}
          </span>
        </label>
      </fieldset>
      {state?.error && <Note ok={false} text={t(state.error as MessageKey)} />}
      {state?.ok && state.message && <Note ok text={t(state.message as MessageKey)} />}
      <Button type="submit" variant="lime" size="lg" disabled={pending}>
        {pending ? t("admin.msg.sending") : t("admin.msg.send")}
      </Button>
    </form>
  );
}

export function DeleteMessageButton({ id }: { id: string }) {
  const { t } = useI18n();
  const { pending, run } = useRun();
  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={() => run(() => deleteAnnouncementAction(id), "admin.user.done", "admin.msg.deleteConfirm")}>
      {t("admin.msg.delete")}
    </Button>
  );
}
