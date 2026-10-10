"use client";

import { Check, RotateCcw, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { buttonClass } from "@/components/ui/Button";
import { ExerciseFigure } from "@/components/workouts/ExerciseFigure";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n/messages/en";
import type { Pattern } from "@/lib/workouts/types";
import { generateClipAction, refreshClipAction, reviewClipAction } from "@/server/actions/exerciseMedia";

type Clip = { id: string; status: "generating" | "ready" | "approved" | "rejected" | "failed"; error: string | null } | null;

export function ClipRow({ exerciseId, name, pattern, clip, configured }: { exerciseId: string; name: string; pattern: Pattern; clip: Clip; configured: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const status = clip?.status ?? "none";

  // Poll while Google renders the clip.
  useEffect(() => {
    if (clip?.status !== "generating") return;
    const id = setInterval(async () => {
      const res = await refreshClipAction(clip.id);
      if (!res.ok || res.status !== "generating") router.refresh();
    }, 8000);
    return () => clearInterval(id);
  }, [clip, router]);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok && "error" in res && res.error) setError(t(res.error as MessageKey));
      router.refresh();
    });

  return (
    <li className="card flex flex-col gap-2.5 p-2.5 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-sand">
          {clip && (clip.status === "ready" || clip.status === "approved") ? (
            <video src={`/api/media/exercise/${clip.id}`} className="h-full w-full object-cover" autoPlay muted loop playsInline aria-label={name} />
          ) : (
            <ExerciseFigure pattern={pattern} label={name} animate={false} className="h-full w-full p-2" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold">{name}</p>
          <p
            className={cn(
              "text-sm font-medium",
              status === "approved" ? "text-forest" : status === "ready" ? "text-amber-ink" : status === "failed" ? "text-terracotta" : "text-muted",
            )}
          >
            {t(`media.status.${status}` as MessageKey)}
            {clip?.error && status === "failed" && <span className="text-muted"> · {clip.error}</span>}
          </p>
          {error && <p className="text-sm text-terracotta">{error}</p>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {status === "ready" && (
          <>
            <button type="button" disabled={pending} onClick={() => run(() => reviewClipAction(clip!.id, "approved"))} className={buttonClass("lime", "sm")}>
              <Check className="size-4" aria-hidden /> {t("media.approve")}
            </button>
            <button type="button" disabled={pending} onClick={() => run(() => reviewClipAction(clip!.id, "rejected"))} className={buttonClass("outline", "sm")}>
              <X className="size-4" aria-hidden /> {t("media.reject")}
            </button>
          </>
        )}
        {status === "approved" && (
          <button type="button" disabled={pending} onClick={() => run(() => reviewClipAction(clip!.id, "rejected"))} className={buttonClass("ghost", "sm")}>
            <X className="size-4" aria-hidden /> {t("media.reject")}
          </button>
        )}
        {configured && status !== "generating" && (
          <button type="button" disabled={pending} onClick={() => run(() => generateClipAction(exerciseId))} className={buttonClass(status === "none" ? "primary" : "outline", "sm")}>
            {status === "none" ? <Sparkles className="size-4" aria-hidden /> : <RotateCcw className="size-4" aria-hidden />}
            {status === "none" ? t("media.generate") : t("media.regenerate")}
          </button>
        )}
      </div>
    </li>
  );
}
