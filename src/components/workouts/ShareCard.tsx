"use client";

import { Check, Copy, Link2, Share2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, useTransition } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button, buttonClass } from "@/components/ui/Button";
import { createShareLinkAction, revokeShareLinkAction } from "@/server/actions/share";

const noop = () => () => {};

/** Create, copy, share or turn off the public plan link. */
export function ShareCard({ token, views }: { token: string | null; views: number }) {
  const { t } = useI18n();
  const router = useRouter();
  const [current, setCurrent] = useState(token);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  // Browser-only values, read without a hydration mismatch.
  const origin = useSyncExternalStore(noop, () => window.location.origin, () => "");
  const canShare = useSyncExternalStore(noop, () => "share" in navigator, () => false);
  const url = current ? `${origin}/s/${current}` : null;

  const create = () =>
    start(async () => {
      const res = await createShareLinkAction();
      setCurrent(res.token);
      router.refresh();
    });
  const revoke = () =>
    start(async () => {
      await revokeShareLinkAction();
      setCurrent(null);
      router.refresh();
    });
  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <section className="card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-lime-100 text-forest-700">
          <Link2 className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">{t("share.title")}</h2>
          <p className="mt-0.5 flex items-start gap-1.5 text-sm text-muted">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden /> {t("share.body")}
          </p>
        </div>
      </div>
      {url ? (
        <div className="mt-3 space-y-2.5">
          <div className="flex items-center gap-2 rounded-2xl border border-line bg-sand/60 py-1.5 pr-1.5 pl-3.5">
            <span className="min-w-0 flex-1 truncate font-mono text-sm text-ink-2 select-all">
              {url}
            </span>
            <button type="button" onClick={copy} className={buttonClass("lime", "sm")} aria-live="polite">
              {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />} {copied ? t("share.copied") : t("share.copy")}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canShare && (
              <button type="button" onClick={() => void navigator.share({ title: t("share.heading"), url }).catch(() => {})} className={buttonClass("outline", "sm")}>
                <Share2 className="size-4" aria-hidden /> {t("share.native")}
              </button>
            )}
            <button type="button" onClick={revoke} disabled={pending} className={buttonClass("ghost", "sm")}>
              {t("share.revoke")}
            </button>
            <span className="ml-auto text-xs text-muted tabular">{t("share.views", { n: views })}</span>
          </div>
        </div>
      ) : (
        <Button variant="primary" size="md" className="mt-3" onClick={create} disabled={pending}>
          {t("share.create")}
        </Button>
      )}
    </section>
  );
}
