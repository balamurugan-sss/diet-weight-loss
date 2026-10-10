"use client";

import { CalendarPlus, Play, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { GuideBlock } from "@/lib/guides/types";
import { addSideProgramAction, endSideProgramAction, startGuideProgramAction } from "@/server/actions/workouts";

export function PrintButton({ label }: { label: string }) {
  return (
    <Button variant="outline" size="lg" onClick={() => window.print()} className="no-print">
      <Printer className="size-5" aria-hidden /> {label}
    </Button>
  );
}

/** Makes the guide's program the active one, then opens My program. */
export function StartProgramButton({ programId, active }: { programId: string; active: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  if (active)
    return (
      <Button variant="secondary" size="xl" className="no-print w-full" onClick={() => router.push("/home")}>
        {t("explore.following")}
      </Button>
    );
  return (
    <div className="no-print space-y-2">
      {confirm && <p className="rounded-md bg-sand px-3 py-2 text-sm text-ink-2">{t("explore.replaceNote")}</p>}
      <Button
        variant="lime"
        size="xl"
        className="w-full justify-between"
        disabled={pending}
        onClick={() => {
          if (!confirm) return setConfirm(true);
          start(async () => {
            const res = await startGuideProgramAction(programId);
            if (res.ok) router.push("/home");
          });
        }}
      >
        {confirm ? t("explore.confirmStart") : t("explore.start")} <Play className="size-5" aria-hidden />
      </Button>
    </div>
  );
}

/** Self-check quiz: tally which outcome the answers point to. */
export function Quiz({ block }: { block: Extract<GuideBlock, { kind: "quiz" }> }) {
  const { t } = useI18n();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const done = Object.keys(answers).length === block.questions.length;
  const tally = Object.values(answers).reduce<Record<string, number>>((a, o) => ({ ...a, [o]: (a[o] ?? 0) + 1 }), {});
  const top = done ? Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] : null;
  return (
    <div className="no-print space-y-4 rounded-md bg-sand p-4">
      {block.questions.map((q, i) => (
        <fieldset key={i}>
          <legend className="mb-2 font-semibold">
            {i + 1}. {q.q}
          </legend>
          <div className="flex flex-col gap-1.5">
            {q.options.map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => setAnswers((a) => ({ ...a, [i]: o.outcome }))}
                aria-pressed={answers[i] === o.outcome}
                className={cn("rounded-md border px-3 py-2.5 text-left text-[15px]", answers[i] === o.outcome ? "border-lime bg-forest-50" : "border-line bg-surface")}
              >
                {o.label}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      {top && block.outcomes[top] ? (
        <div role="status" className="rounded-md bg-surface p-4">
          <p className="text-sm font-bold text-lime uppercase">{t("explore.yourResult")}</p>
          <p className="mt-1 text-lg font-bold">{block.outcomes[top].title}</p>
          <p className="mt-1 text-[15px] text-ink-2">{block.outcomes[top].text}</p>
        </div>
      ) : (
        <p className="text-sm text-muted">{t("explore.answerAll", { n: block.questions.length })}</p>
      )}
    </div>
  );
}

/** "Add to my day": follow this program alongside the main one; both show on My program. */
export function AddToDayButton({ programId, sideId }: { programId: string; sideId: string | null }) {
  const { t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();
  if (sideId)
    return (
      <div className="no-print flex flex-wrap items-center gap-2 rounded-md bg-sand p-3">
        <p className="flex-1 text-sm font-semibold text-ink-2">{t("explore.alongside")}</p>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await endSideProgramAction(sideId);
              router.refresh();
            })
          }
        >
          {t("explore.stopAlongside")}
        </Button>
      </div>
    );
  return (
    <Button
      variant="outline"
      size="xl"
      className="no-print w-full justify-between"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await addSideProgramAction(programId);
          if (res.ok) router.push("/home");
        })
      }
    >
      {t("explore.addToDay")} <CalendarPlus className="size-5" aria-hidden />
    </Button>
  );
}
