"use client";

import { BellRing, Mail } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { removePushSubscriptionAction, savePushSubscriptionAction, setMarketingEmailAction, unsubscribeAction } from "@/server/actions/notifications";

function Switch({ on, disabled, onClick, label }: { on: boolean; disabled?: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn("relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-50", on ? "bg-lime" : "bg-sand-2")}
    >
      <span className={cn("absolute top-1 size-6 rounded-full bg-white transition-[left]", on ? "left-7" : "left-1")} />
    </button>
  );
}

const keyBytes = (b64: string) => {
  const s = atob(b64.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
};

type PushState = "loading" | "unsupported" | "blocked" | "off" | "on";

/** Offers and news: push on this device (browser permission) and email (opt-in). */
export function NotificationSettings({ vapidKey, marketingEmail }: { vapidKey: string | null; marketingEmail: boolean }) {
  const { t } = useI18n();
  const [push, setPush] = useState<PushState>("loading");
  const [email, setEmail] = useState(marketingEmail);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    const probe = async (): Promise<PushState> => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
      if (Notification.permission === "denied") return "blocked";
      const reg = await navigator.serviceWorker.getRegistration("/");
      return (await reg?.pushManager.getSubscription()) ? "on" : "off";
    };
    probe().then(setPush, () => setPush("off"));
  }, []);

  const togglePush = () =>
    start(async () => {
      setError(null);
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        const existing = await reg.pushManager.getSubscription();
        if (push === "on" && existing) {
          await removePushSubscriptionAction(existing.endpoint);
          await existing.unsubscribe();
          return setPush("off");
        }
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return setPush(permission === "denied" ? "blocked" : "off");
        const sub = existing ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(vapidKey!) }));
        const res = await savePushSubscriptionAction(sub.toJSON());
        if (!res.ok) return setError(res.error);
        setPush("on");
      } catch {
        setError("common.error");
      }
    });

  const toggleEmail = () =>
    start(async () => {
      setError(null);
      const res = await setMarketingEmailAction(!email);
      if (res.ok) setEmail(!email);
      else setError(res.error);
    });

  const pushNote =
    !vapidKey ? t("notify.pushUnavailable") : push === "unsupported" ? t("notify.pushUnsupported") : push === "blocked" ? t("notify.pushBlocked") : t("notify.pushBody");
  const row = "flex items-center gap-4 px-4 py-3.5";

  return (
    <section aria-labelledby="notify-title" className="mt-6 space-y-2">
      <h2 id="notify-title" className="px-1 text-lg font-bold">
        {t("notify.title")}
      </h2>
      <div className="divide-y divide-line overflow-hidden rounded-md bg-surface">
        <div className={row}>
          <BellRing className="size-6 shrink-0 text-ink-2" strokeWidth={1.8} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-[17px]">{t("notify.push")}</p>
            <p className="text-sm text-muted">{pushNote}</p>
          </div>
          <Switch on={push === "on"} disabled={!vapidKey || pending || push === "loading" || push === "unsupported" || push === "blocked"} onClick={togglePush} label={t("notify.push")} />
        </div>
        <div className={row}>
          <Mail className="size-6 shrink-0 text-ink-2" strokeWidth={1.8} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-[17px]">{t("notify.email")}</p>
            <p className="text-sm text-muted">{t("notify.emailBody")}</p>
          </div>
          <Switch on={email} disabled={pending} onClick={toggleEmail} label={t("notify.email")} />
        </div>
      </div>
      {error && (
        <p role="alert" className="px-1 text-sm text-terracotta">
          {t(error as MessageKey)}
        </p>
      )}
    </section>
  );
}

export function UnsubscribeButton({ token }: { token: string }) {
  const { t } = useI18n();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<"done" | "bad" | null>(null);
  if (result === "done") return <p role="status" className="rounded-md bg-sand px-3 py-2 text-[15px]">{t("unsub.done")}</p>;
  return (
    <>
      {result === "bad" && (
        <p role="alert" className="rounded-md bg-terracotta-100 px-3 py-2 text-sm text-terracotta">
          {t("unsub.bad")}
        </p>
      )}
      <Button size="lg" className="w-full" disabled={pending || !token} onClick={() => start(async () => setResult((await unsubscribeAction(token)).ok ? "done" : "bad"))}>
        {t("unsub.confirm")}
      </Button>
    </>
  );
}
