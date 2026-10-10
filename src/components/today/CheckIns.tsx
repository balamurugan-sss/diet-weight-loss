"use client";

import { AlarmClock, CupSoda, Dumbbell, Play, Sunrise, Utensils, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button, buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n/messages/en";
import type { QuickFood } from "@/lib/today/quickFoods";
import type { PromptId } from "@/lib/today/timeline";
import { markAteAction, quickLogAction, setWakeTimeAction, setWorkoutTimeAction } from "@/server/actions/today";

export type CheckInProps = {
  prompts: PromptId[];
  now: string;
  deviceWake: string | null;
  workoutPlan: string | null;
  startHref: string | null;
  foods: { morning: QuickFood[]; pre: QuickFood[]; protein: QuickFood[] };
  proteinLeftG: number;
};

const timeInput =
  "h-12 rounded-lg border border-line bg-surface px-3 font-display text-[22px] font-bold tabular outline-none focus:border-forest focus:ring-2 focus:ring-forest/20";

/** Round up to the next half hour, e.g. 17:05 → 17:30. */
function nextHalfHour(now: string) {
  const [h, m] = now.split(":").map(Number);
  const t = Math.min(23 * 60 + 30, Math.ceil((h * 60 + m + 1) / 30) * 30);
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

const addMin = (hhmm: string, d: number) => {
  const [h, m] = hhmm.split(":").map(Number);
  const t = Math.max(0, Math.min(23 * 60 + 59, h * 60 + m + d));
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};

/** The day's interactive questions: wake-up, morning drink, workout time, pre-workout food, protein. Two at a time. */
export function CheckIns(props: CheckInProps) {
  const { t } = useI18n();
  const [hidden, setHidden] = useState<PromptId[]>([]);
  const visible = props.prompts.filter((p) => !hidden.includes(p)).slice(0, 2);
  if (!visible.length) return null;
  const dismiss = (id: PromptId) => setHidden((h) => [...h, id]);
  return (
    <section aria-label={t("today.checkins")} className="space-y-3">
      {visible.map((id) => (
        <Prompt key={id} id={id} {...props} onDismiss={() => dismiss(id)} />
      ))}
    </section>
  );
}

function Shell({ icon: Icon, title, body, children, onDismiss, accent }: { icon: typeof Sunrise; title: string; body?: string; children: React.ReactNode; onDismiss?: () => void; accent?: boolean }) {
  const { t } = useI18n();
  return (
    <div className={cn("relative overflow-hidden p-4", accent ? "card-lime-strong" : "card border-l-4 border-l-lime")}>
      <div className="flex items-start gap-3">
        <span className={cn("grid size-10 shrink-0 -skew-x-6 place-items-center rounded-lg", accent ? "bg-[#0a0c0e] text-[#ff5a1f]" : "bg-lime text-white")}>
          <Icon className="size-5 skew-x-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="pr-8 text-[1.3rem] leading-tight">{title}</h2>
          {body && <p className={cn("mt-0.5 text-[15px]", accent ? "text-white/75" : "text-muted")}>{body}</p>}
        </div>
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="absolute top-3 right-3 grid size-9 place-items-center rounded-lg text-muted hover:bg-sand" aria-label={t("today.notNow")}>
          <X className="size-4" aria-hidden />
        </button>
      )}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function useAct() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  return { pending, error, run };
}

function FoodChips({ foods, onPick, pending }: { foods: QuickFood[]; onPick: (f: QuickFood) => void; pending: boolean }) {
  const { t } = useI18n();
  return (
    <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {foods.map((f) => (
        <li key={f.id} className="shrink-0">
          <button
            type="button"
            disabled={pending}
            onClick={() => onPick(f)}
            className="flex w-44 flex-col items-start rounded-lg border border-line bg-surface p-3 text-left transition-colors hover:border-forest/50 disabled:opacity-60"
          >
            <span className="font-semibold leading-tight">{f.title}</span>
            <span className="mt-0.5 text-xs text-muted">{f.serving}</span>
            <span className="mt-1.5 text-sm font-semibold text-forest tabular">
              {f.proteinG >= 5 ? t("today.food.protein", { g: f.proteinG, kcal: f.kcal }) : t("today.food.kcal", { kcal: f.kcal })}
            </span>
            <span className="mt-1 line-clamp-2 text-xs leading-snug text-muted">{f.note}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Prompt({ id, now, deviceWake, workoutPlan, startHref, foods, proteinLeftG, onDismiss }: CheckInProps & { id: PromptId; onDismiss: () => void }) {
  const { t } = useI18n();
  const { pending, error, run } = useAct();
  const [wake, setWake] = useState(deviceWake ?? now);
  const [plan, setPlan] = useState(workoutPlan ?? nextHalfHour(now));
  const [hungry, setHungry] = useState(false);
  const log = (f: QuickFood) => run(() => quickLogAction(f.id));
  const err = error && (
    <p role="alert" className="mt-2 text-sm text-terracotta">
      {t(error as MessageKey)}
    </p>
  );

  switch (id) {
    case "wake":
      return (
        <Shell icon={Sunrise} title={t("today.q.wake")} body={deviceWake ? t("today.q.wakeDevice", { time: deviceWake }) : t("today.q.wakeBody")} onDismiss={onDismiss}>
          <div className="flex flex-wrap items-center gap-2">
            <input type="time" value={wake} onChange={(e) => setWake(e.target.value)} className={timeInput} aria-label={t("today.q.wake")} />
            <Button variant="lime" size="lg" disabled={pending || !wake} onClick={() => run(() => setWakeTimeAction(wake))}>
              {t("common.save")}
            </Button>
          </div>
          {err}
        </Shell>
      );
    case "morning_drink":
      return (
        <Shell icon={CupSoda} title={t("today.q.drink")} body={t("today.q.drinkBody")} onDismiss={onDismiss}>
          <FoodChips foods={foods.morning} onPick={log} pending={pending} />
          {err}
        </Shell>
      );
    case "plan_workout":
      return (
        <Shell icon={AlarmClock} title={t("today.q.plan")} body={t("today.q.planBody")} onDismiss={onDismiss}>
          <div className="flex flex-wrap items-center gap-2">
            <input type="time" value={plan} onChange={(e) => setPlan(e.target.value)} className={timeInput} aria-label={t("today.q.plan")} />
            <Button variant="lime" size="lg" disabled={pending || !plan} onClick={() => run(() => setWorkoutTimeAction(plan))}>
              {t("today.setTime")}
            </Button>
            {startHref && (
              <Link href={startHref} className={buttonClass("outline", "lg")}>
                <Play className="size-5" aria-hidden /> {t("today.startNow")}
              </Link>
            )}
          </div>
          {err}
        </Shell>
      );
    case "start_workout":
      return (
        <Shell icon={Dumbbell} title={t("today.q.start", { time: workoutPlan ?? now })} body={t("today.q.startBody")} accent>
          <div className="flex flex-wrap gap-2">
            {startHref && (
              <Link href={startHref} className={buttonClass("primary", "xl", "flex-1")}>
                <Play className="size-5" aria-hidden /> {t("today.startNow")}
              </Link>
            )}
            <button type="button" disabled={pending} onClick={() => run(() => setWorkoutTimeAction(addMin(now, 30)))} className={buttonClass("outline", "xl", "border-[#0a0c0e]/25 bg-transparent text-white")}>
              {t("today.later30")}
            </button>
          </div>
          {err}
        </Shell>
      );
    case "pre_workout":
      return (
        <Shell icon={Utensils} title={t("today.q.ate")} body={workoutPlan ? t("today.q.ateBodyAt", { time: workoutPlan }) : t("today.q.ateBody")} onDismiss={onDismiss}>
          {hungry ? (
            <>
              <p className="mb-2 text-sm font-semibold">{t("today.q.preIdeas")}</p>
              <FoodChips foods={foods.pre} onPick={log} pending={pending} />
            </>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="lg" className="flex-1" disabled={pending} onClick={() => run(() => markAteAction())}>
                {t("today.q.ateYes")}
              </Button>
              <Button variant="lime" size="lg" className="flex-1" onClick={() => setHungry(true)}>
                {t("today.q.ateNo")}
              </Button>
            </div>
          )}
          {err}
        </Shell>
      );
    case "protein":
    case "protein_gap":
      return (
        <Shell
          icon={Dumbbell}
          title={id === "protein" ? t("today.q.protein") : t("today.q.proteinGap", { g: proteinLeftG })}
          body={id === "protein" ? t("today.q.proteinBody", { g: Math.max(0, proteinLeftG) }) : t("today.q.proteinGapBody")}
          onDismiss={onDismiss}
        >
          <FoodChips foods={foods.protein} onPick={log} pending={pending} />
          {err}
        </Shell>
      );
  }
}
