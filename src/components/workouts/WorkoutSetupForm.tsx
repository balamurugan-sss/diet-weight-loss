"use client";

import { Building2, Check, Dumbbell, House, Shuffle, Stethoscope } from "lucide-react";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { DAYS_PER_WEEK, HOME_EQUIPMENT, LEVELS, WORKOUT_GOALS, type DaysPerWeek, type HomeEquipment, type Level, type Location, type WorkoutGoal } from "@/lib/workouts/types";
import { saveWorkoutSetupAction } from "@/server/actions/workouts";

export type SetupDefaults = { location: Location; level: Level; goal: WorkoutGoal; daysPerWeek: DaysPerWeek; equipment: HomeEquipment[] };

const LOCATION_ICONS = { home: House, gym: Building2, mix: Shuffle } as const;

export function WorkoutSetupForm({
  defaults,
  foodGoal,
  cautions,
  existing,
}: {
  defaults: SetupDefaults;
  foodGoal: WorkoutGoal;
  cautions: MessageKey[];
  existing: boolean;
}) {
  const { t } = useI18n();
  const [d, setD] = useState(defaults);
  const [ack, setAck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof SetupDefaults>(k: K, v: SetupDefaults[K]) => setD((x) => ({ ...x, [k]: v }));

  const option = (selected: boolean, onClick: () => void, title: string, desc?: string, extra?: React.ReactNode) => (
    <button
      key={title}
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all",
        selected ? "border-forest bg-forest-50 ring-2 ring-forest/15" : "border-line bg-surface hover:border-forest/40",
      )}
    >
      <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2", selected ? "border-forest bg-forest text-on-accent" : "border-line")}>
        {selected && <Check className="size-3.5" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2 font-semibold">
          {title} {extra}
        </span>
        {desc && <span className="mt-0.5 block text-sm leading-snug text-muted">{desc}</span>}
      </span>
    </button>
  );
  const question = (n: number, key: MessageKey, help?: MessageKey) => (
    <div className="mb-3">
      <p className="text-xs font-bold tracking-wide text-forest uppercase">{n} / 5</p>
      <h2 className="text-xl font-semibold">{t(key)}</h2>
      {help && <p className="mt-0.5 text-sm text-muted">{t(help)}</p>}
    </div>
  );

  const submit = () => {
    setError(null);
    start(async () => {
      const res = await saveWorkoutSetupAction({ ...d, equipment: d.location === "gym" ? [] : d.equipment, doctorAck: ack });
      if (res && !res.ok) setError(t(res.error as MessageKey));
    });
  };

  return (
    <div className="space-y-8">
      <section>
        {question(1, "wk.q.location")}
        <div className="grid gap-2.5 sm:grid-cols-3">
          {(["home", "gym", "mix"] as const).map((loc) => {
            const Icon = LOCATION_ICONS[loc];
            const selected = d.location === loc;
            return (
              <button
                key={loc}
                type="button"
                aria-pressed={selected}
                onClick={() => set("location", loc)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-4 text-left transition-all sm:flex-col sm:items-start",
                  selected ? "card-lime-strong border-transparent" : "border-line bg-surface hover:border-forest/40",
                )}
              >
                <span className={cn("grid size-11 shrink-0 place-items-center rounded-full", selected ? "bg-[#0a0c0e] text-[#c6f135]" : "bg-sand text-forest")}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-display text-lg font-bold">{t(`wk.loc.${loc}`)}</span>
                  <span className={cn("block text-sm leading-snug", selected ? "text-[#0a0c0e]/70" : "text-muted")}>{t(`wk.loc.${loc}.help`)}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        {question(2, "wk.q.level")}
        <div className="space-y-2.5">{LEVELS.map((l) => option(d.level === l, () => set("level", l), t(`wk.level.${l}`), t(`wk.level.${l}.help`)))}</div>
      </section>

      <section>
        {question(3, "wk.q.goal")}
        <div className="space-y-2.5">
          {WORKOUT_GOALS.map((g) =>
            option(
              d.goal === g,
              () => set("goal", g),
              t(`wk.goal.${g}`),
              undefined,
              g === foodGoal ? <span className="rounded-full bg-lime-100 px-2 py-0.5 text-xs font-semibold text-forest-700">{t("wk.goal.fromFood")}</span> : null,
            ),
          )}
        </div>
      </section>

      <section>
        {question(4, "wk.q.days", "wk.days.help")}
        <div role="radiogroup" aria-label={t("wk.q.days")} className="grid grid-cols-4 gap-2">
          {DAYS_PER_WEEK.map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={d.daysPerWeek === n}
              onClick={() => set("daysPerWeek", n)}
              className={cn(
                "flex h-20 flex-col items-center justify-center rounded-2xl border transition-all",
                d.daysPerWeek === n ? "border-forest bg-forest text-on-accent" : "border-line bg-surface hover:border-forest/40",
              )}
            >
              <span className="font-display text-3xl font-bold tabular">{n}</span>
              <span className={cn("text-xs font-medium", d.daysPerWeek === n ? "text-on-accent/70" : "text-muted")}>{t("wk.daysUnit")}</span>
            </button>
          ))}
        </div>
      </section>

      {d.location !== "gym" && (
        <section>
          {question(5, "wk.q.equipment", "wk.q.equipment.help")}
          <div className="flex flex-wrap gap-2">
            <Chip selected={d.equipment.length === 0} onClick={() => set("equipment", [])}>
              {t("wk.eq.none")}
            </Chip>
            {HOME_EQUIPMENT.map((e) => (
              <Chip
                key={e}
                selected={d.equipment.includes(e)}
                onClick={() => set("equipment", d.equipment.includes(e) ? d.equipment.filter((x) => x !== e) : [...d.equipment, e])}
              >
                <Dumbbell className="size-3.5" aria-hidden /> {t(`wk.eq.${e}`)}
              </Chip>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-[var(--radius-card)] border border-amber/30 bg-amber-100 p-4 text-amber-ink">
        <p className="flex items-center gap-2 font-semibold">
          <Stethoscope className="size-5 shrink-0" aria-hidden /> {t("wk.doctor.title")}
        </p>
        <p className="mt-1.5 text-[15px] leading-relaxed">{t("wk.doctor.body")}</p>
        {cautions.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed">
            {cautions.map((c) => (
              <li key={c}>{t(c)}</li>
            ))}
          </ul>
        )}
        <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-2xl bg-surface/60 p-3 text-charcoal">
          <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--color-forest)]" />
          <span className="text-[15px] font-medium">{t("wk.doctor.ack")}</span>
        </label>
      </section>

      <div className="space-y-2">
        {existing && <p className="text-sm text-muted">{t("wk.setup.restartNote")}</p>}
        {error && (
          <p role="alert" className="text-sm font-medium text-terracotta">
            {error}
          </p>
        )}
        <Button size="xl" variant="lime" className="w-full sm:w-auto" disabled={!ack || pending} onClick={submit}>
          {pending ? t("common.saving") : existing ? t("wk.setup.update") : t("wk.setup.cta")}
        </Button>
      </div>
    </div>
  );
}
