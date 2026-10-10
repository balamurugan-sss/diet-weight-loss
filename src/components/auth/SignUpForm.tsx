"use client";

import { useActionState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { signUp } from "@/server/actions/auth";
import { inputClass } from "./LoginForm";

export function SignUpForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(signUp, undefined);
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">{t("auth.name")}</span>
        <input name="displayName" autoComplete="given-name" required maxLength={60} className={inputClass} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">{t("auth.email")}</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state?.email}
          key={state?.email}
          className={inputClass}
        />
      </label>
      <div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">{t("auth.password")}</span>
          <input name="password" type="password" autoComplete="new-password" required minLength={10} aria-describedby="pw-hint" className={inputClass} />
        </label>
        <p id="pw-hint" className="mt-1 text-xs text-muted">
          {t("auth.passwordHint")}
        </p>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">{t("auth.confirmPassword")}</span>
        <input name="confirm" type="password" autoComplete="new-password" required minLength={10} className={inputClass} />
      </label>
      <label className="flex items-start gap-3 text-sm leading-snug text-ink-2">
        <input name="terms" type="checkbox" required className="mt-0.5 size-5 shrink-0 accent-[var(--color-lime)]" />
        <span>{t("auth.consent")}</span>
      </label>
      {state?.error && (
        <p role="alert" className="rounded-xl bg-terracotta-100 px-3 py-2 text-sm text-terracotta">
          {t(state.error as MessageKey)}
        </p>
      )}
      <Button type="submit" size="lg" variant="lime" className="w-full" disabled={pending}>
        {pending ? t("auth.signingUp") : t("auth.signup")}
      </Button>
    </form>
  );
}
