"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { requestPasswordReset, resetPassword } from "@/server/actions/auth";
import { inputClass } from "./LoginForm";

function ErrorNote({ error }: { error?: string }) {
  const { t } = useI18n();
  if (!error) return null;
  return (
    <p role="alert" className="rounded-xl bg-terracotta-100 px-3 py-2 text-sm text-terracotta">
      {t(error as MessageKey)}
    </p>
  );
}

/** Step 1: the email to send the link to. Always ends on the same "check your inbox" note. */
export function ForgotPasswordForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);
  if (state?.ok)
    return (
      <p role="status" className="rounded-xl bg-sand px-4 py-3 text-[15px] text-ink-2">
        {t("auth.linkSent", { email: state.email ?? "" })}
      </p>
    );
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">{t("auth.email")}</span>
        <input name="email" type="email" autoComplete="email" required defaultValue={state?.email} key={state?.email} className={inputClass} />
      </label>
      <ErrorNote error={state?.error} />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? t("auth.sending") : t("auth.sendLink")}
      </Button>
    </form>
  );
}

/** Step 2: from the emailed link — choose the new password. */
export function ResetPasswordForm({ token }: { token: string }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(resetPassword, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">{t("auth.newPassword")}</span>
          <input name="password" type="password" autoComplete="new-password" required minLength={10} aria-describedby="pw-hint" className={inputClass} />
        </label>
        <p id="pw-hint" className="mt-1.5 text-xs text-muted">
          {t("auth.passwordHint")}
        </p>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">{t("auth.confirmPassword")}</span>
        <input name="confirm" type="password" autoComplete="new-password" required minLength={10} className={inputClass} />
      </label>
      <ErrorNote error={state?.error} />
      {state?.error === "auth.resetExpired" && (
        <Link href="/forgot-password" className="block font-semibold text-forest underline-offset-4 hover:underline">
          {t("auth.requestNew")}
        </Link>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? t("auth.saving") : t("auth.savePassword")}
      </Button>
    </form>
  );
}
