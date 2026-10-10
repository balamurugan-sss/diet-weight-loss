"use client";

import { RefreshCw, Watch } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { buttonClass } from "@/components/ui/Button";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { disconnectGoogleHealthAction, syncGoogleHealthAction } from "@/server/actions/health";

export function GoogleHealthCard({
  configured,
  connected,
  lastSync,
  lastError,
  status,
}: {
  configured: boolean;
  connected: boolean;
  lastSync: string | null;
  lastError: string | null;
  status: string | null;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [note, setNote] = useState<string | null>(status ? t(`health.google.${status}` as MessageKey) : lastError ? t(`health.google.${lastError}` as MessageKey) : null);

  const sync = () =>
    start(async () => {
      const res = await syncGoogleHealthAction();
      setNote(res.ok ? t("health.import.saved", { days: res.days, workouts: res.workouts }) : t(res.error as MessageKey));
      router.refresh();
    });
  const disconnect = () =>
    start(async () => {
      await disconnectGoogleHealthAction();
      setNote(null);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-water-100 text-water">
          <Watch className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold">{t("health.google.title")}</h3>
          <p className="text-sm text-muted">{configured ? t("health.google.body") : t("health.google.notConfigured")}</p>
          {connected && lastSync && <p className="mt-0.5 text-xs text-muted">{t("health.google.lastSync", { when: lastSync })}</p>}
        </div>
      </div>
      {configured && (
        <div className="flex flex-wrap gap-2">
          {connected ? (
            <>
              <button type="button" onClick={sync} disabled={pending} className={buttonClass("primary", "sm")}>
                <RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} aria-hidden /> {t("health.google.sync")}
              </button>
              <button type="button" onClick={disconnect} disabled={pending} className={buttonClass("ghost", "sm")}>
                {t("health.google.disconnect")}
              </button>
            </>
          ) : (
            // A full navigation: the route redirects to Google's consent screen.
            <a href="/api/health/google/start" className={buttonClass("primary", "sm")}>
              {t("health.google.connect")}
            </a>
          )}
        </div>
      )}
      {note && (
        <p role="status" className="text-sm font-medium text-ink-2">
          {note}
        </p>
      )}
    </div>
  );
}
