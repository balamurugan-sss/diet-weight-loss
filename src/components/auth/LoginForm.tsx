"use client";

import { useActionState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { logIn } from "@/server/actions/auth";

export const inputClass =
  "h-12 w-full rounded-2xl border border-line bg-surface px-4 text-base outline-none transition-colors placeholder:text-muted/70 focus:border-forest focus:ring-2 focus:ring-forest/15";

export function LoginForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(logIn, undefined);
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">{t("auth.email")}</span>
        <input name="email" type="email" autoComplete="email" required className={inputClass} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">{t("auth.password")}</span>
        <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </label>
      {state?.error && (
        <p role="alert" className="rounded-xl bg-terracotta-100 px-3 py-2 text-sm text-terracotta">
          {t(state.error as MessageKey)}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? t("auth.loggingIn") : t("auth.login")}
      </Button>
    </form>
  );
}
