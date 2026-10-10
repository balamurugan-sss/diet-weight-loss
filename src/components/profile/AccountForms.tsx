"use client";

import { useActionState, useState, useTransition } from "react";
import { inputClass } from "@/components/auth/LoginForm";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { deleteAccountAction, billingPortalAction, startCheckoutAction, toggleDevPremiumAction } from "@/server/actions/account";
import { logOut, secureAccount } from "@/server/actions/auth";

export function SecureAccountForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(secureAccount, undefined);
  if (state?.ok) return <p className="rounded-2xl bg-forest-50 px-3 py-2 text-sm font-semibold text-forest">{t("auth.secured")}</p>;
  return (
    <form action={action} className="space-y-3">
      <p className="text-sm text-muted">{t("auth.secureBody")}</p>
      <input name="email" type="email" autoComplete="email" required placeholder={t("auth.email")} aria-label={t("auth.email")} className={inputClass} />
      <input name="password" type="password" autoComplete="new-password" required minLength={10} placeholder={t("auth.passwordHint")} aria-label={t("auth.password")} className={inputClass} />
      {state?.error && <p role="alert" className="text-sm text-terracotta">{t(state.error as MessageKey)}</p>}
      <Button type="submit" disabled={pending}>
        {t("auth.secureCta")}
      </Button>
    </form>
  );
}

export function LogoutButton() {
  const { t } = useI18n();
  return (
    <form action={logOut}>
      <Button variant="outline" type="submit">
        {t("auth.logout")}
      </Button>
    </form>
  );
}

export function DeleteAccountForm() {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(deleteAccountAction, undefined);
  const [value, setValue] = useState("");
  return (
    <form action={action} className="space-y-2">
      <p className="text-sm text-muted">{t("profile.deleteConfirm")}</p>
      <div className="flex gap-2">
        <input name="confirm" value={value} onChange={(e) => setValue(e.target.value)} className={inputClass} aria-label={t("profile.deleteConfirm")} placeholder="DELETE" autoComplete="off" />
        <Button variant="danger" type="submit" disabled={pending || value !== "DELETE"}>
          {t("profile.delete")}
        </Button>
      </div>
      {state?.error && <p className="text-sm text-terracotta">{t(state.error as MessageKey)}</p>}
    </form>
  );
}

export function UpgradeButtons({ isPremium, configured, devToggle }: { isPremium: boolean; configured: boolean; devToggle: boolean }) {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      {configured ? (
        <Button
          variant={isPremium ? "outline" : "lime"}
          size="lg"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = isPremium ? await billingPortalAction() : await startCheckoutAction();
              if (r?.error) setErr(r.error);
            })
          }
        >
          {isPremium ? t("sub.manage") : t("sub.upgrade")}
        </Button>
      ) : (
        <p className="rounded-2xl bg-sand px-3 py-2 text-sm text-ink-2">{t("sub.notConfigured")}</p>
      )}
      {err && <p className="text-sm text-terracotta">{t(err as MessageKey)}</p>}
      {devToggle && (
        <div className="rounded-2xl border border-dashed border-amber/60 p-3">
          <Button variant="outline" size="sm" disabled={pending} onClick={() => start(async () => void (await toggleDevPremiumAction()))}>
            {t("sub.devToggle")} ({isPremium ? "on" : "off"})
          </Button>
          <p className="mt-1 text-xs text-muted">{t("sub.devNote")}</p>
        </div>
      )}
    </div>
  );
}
