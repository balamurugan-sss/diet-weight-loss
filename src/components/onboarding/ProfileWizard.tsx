"use client";

import { ArrowLeft, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { inputClass } from "@/components/auth/LoginForm";
import { Button } from "@/components/ui/Button";
import { Badge, Chip } from "@/components/ui/Chip";
import { Segmented, Stepper } from "@/components/ui/Stepper";
import { cn } from "@/lib/cn";
import { AVAILABLE_LANGUAGES } from "@/lib/i18n/languages";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { computeBmi } from "@/lib/nutrition/bmi";
import { ageFromDob } from "@/lib/nutrition/energy";
import { screenHealth } from "@/lib/nutrition/safety";
import { KETO_NET_CARB_RANGE } from "@/lib/nutrition/targets";
import { CONDITION_CODES, PLAN_STYLES, type PlanStyle } from "@/lib/nutrition/types";
import { COOKING_TIMES, MEAL_SLOTS, USER_EQUIPMENT, type ProfileInput } from "@/lib/profile/schema";
import { ALLERGENS, AVOID_TAGS, CUISINES } from "@/lib/recipes/types";
import { setLanguage } from "@/server/actions/auth";
import { saveProfile } from "@/server/actions/profile";

export type Draft = Partial<ProfileInput> & {
  language: ProfileInput["language"];
  conditions: string[];
  avoidFoods: string[];
  cuisines: string[];
  allergies: string[];
  equipment: string[];
  mealSlots: string[];
};

const STEPS = ["lang", "about", "body", "activity", "health", "food", "kitchen", "meals", "style", "review"] as const;
type StepId = (typeof STEPS)[number];
const OPTIONAL: StepId[] = ["health", "kitchen"];

function toggle(list: string[], v: string) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export function ProfileWizard({
  initial,
  mode = "onboarding",
  startAt,
}: {
  initial: Draft;
  mode?: "onboarding" | "edit";
  startAt?: StepId;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const steps: StepId[] = mode === "edit" ? STEPS.filter((s) => s !== "lang" && s !== "review") : [...STEPS];
  const [i, setI] = useState(Math.max(0, startAt ? steps.indexOf(startAt) : 0));
  const [d, setD] = useState<Draft>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm");
  const step = steps[i];
  const set = (patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch }));

  const age = d.dateOfBirth ? ageFromDob(d.dateOfBirth) : (d.ageYears ?? null);
  const bmi = d.heightCm && d.weightKg ? computeBmi(d.weightKg, d.heightCm) : null;
  const screening = useMemo(
    () =>
      age && d.heightCm && d.weightKg
        ? screenHealth({
            ageYears: age,
            heightCm: d.heightCm,
            weightKg: d.weightKg,
            targetWeightKg: d.targetWeightKg,
            conditions: d.conditions,
            pregnancy: d.pregnancyStatus ?? "none",
          })
        : null,
    [age, d.heightCm, d.weightKg, d.targetWeightKg, d.conditions, d.pregnancyStatus],
  );

  const valid: Record<StepId, boolean> = {
    lang: !!d.language,
    about: !!d.sexForEquation && !!age && age >= 5 && age <= 110,
    body: !!d.heightCm && d.heightCm >= 100 && d.heightCm <= 230 && !!d.weightKg && d.weightKg >= 25 && d.weightKg <= 300,
    activity: !!d.activityLevel,
    health: true,
    food: !!d.dietPreference,
    kitchen: true,
    meals: d.mealSlots.length >= 2,
    style: !!d.planStyle && (!screening || screening.allowedStyles.includes(d.planStyle)),
    review: true,
  };

  async function finish() {
    setError(null);
    start(async () => {
      const res = await saveProfile({ ...d, pace: d.pace ?? "gentle", householdSize: d.householdSize ?? 1 });
      if (!res.ok) setError(res.error);
      else router.push(mode === "edit" ? "/profile?updated=1" : "/targets");
    });
  }

  function next() {
    if (!valid[step]) {
      setError("ob.required");
      return;
    }
    setError(null);
    if (i === steps.length - 1) return finish();
    setI(i + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const heading = (key: MessageKey, body?: MessageKey) => (
    <div className="mb-6">
      <h1 className="text-[1.75rem] leading-tight font-semibold sm:text-3xl">{t(key)}</h1>
      {body && <p className="mt-2 text-[15px] leading-relaxed text-muted">{t(body)}</p>}
    </div>
  );
  const label = (key: MessageKey, extra?: React.ReactNode) => (
    <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-2">
      {t(key)} {extra}
    </p>
  );
  const optionCard = (selected: boolean, onClick: () => void, title: string, desc?: string, disabled?: boolean, note?: string) => (
    <button
      key={title}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all",
        selected ? "border-forest bg-forest-50 ring-2 ring-forest/15" : "border-line bg-surface hover:border-forest/40",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2", selected ? "border-forest bg-forest text-white" : "border-line")}>
        {selected && <Check className="size-3.5" strokeWidth={3} />}
      </span>
      <span>
        <span className="block font-semibold">{title}</span>
        {desc && <span className="mt-0.5 block text-sm leading-snug text-muted">{desc}</span>}
        {note && <span className="mt-1.5 block text-sm font-medium text-terracotta">{note}</span>}
      </span>
    </button>
  );

  const ftIn = d.heightCm ? { ft: Math.floor(d.heightCm / 30.48), inch: Math.round((d.heightCm / 2.54) % 12) } : { ft: 0, inch: 0 };

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 pt-5 pb-8">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => (i === 0 ? router.push(mode === "edit" ? "/profile" : "/") : setI(i - 1))}
          className="grid size-11 place-items-center rounded-full border border-line bg-surface"
          aria-label={t("common.back")}
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-sand-2" role="progressbar" aria-valuenow={i + 1} aria-valuemax={steps.length}>
            <div className="h-full rounded-full bg-forest transition-all duration-500" style={{ width: `${((i + 1) / steps.length) * 100}%` }} />
          </div>
          <p className="mt-1.5 text-xs font-medium text-muted">{t("ob.step", { n: i + 1, total: steps.length })}</p>
        </div>
      </div>

      <div key={step} className="flex-1 animate-fade-up">
        {step === "lang" && (
          <>
            {heading("ob.lang.title", "ob.lang.body")}
            <div className="grid gap-3">
              {AVAILABLE_LANGUAGES.map((l) =>
                optionCard(
                  d.language === l.code,
                  () => {
                    set({ language: l.code as Draft["language"] });
                    start(async () => {
                      await setLanguage(l.code);
                      router.refresh();
                    });
                  },
                  l.nativeName,
                  l.code === "en-IN" ? "Indian English narration voice" : l.name !== l.nativeName ? l.name : undefined,
                ),
              )}
            </div>
          </>
        )}

        {step === "about" && (
          <div className="space-y-6">
            {heading("ob.about.title")}
            <label className="block">
              {label("ob.about.name", <Badge>{t("common.optional")}</Badge>)}
              <input className={inputClass} value={d.displayName ?? ""} maxLength={60} onChange={(e) => set({ displayName: e.target.value })} autoComplete="given-name" />
            </label>
            <div className="grid grid-cols-[1.4fr_1fr] gap-3">
              <label className="block">
                {label("ob.about.dob")}
                <input
                  type="date"
                  className={inputClass}
                  value={d.dateOfBirth ?? ""}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => set({ dateOfBirth: e.target.value || null, ageYears: e.target.value ? null : d.ageYears })}
                />
              </label>
              <label className="block">
                {label("ob.about.age")}
                <input
                  type="number"
                  inputMode="numeric"
                  className={inputClass}
                  value={d.dateOfBirth ? (age ?? "") : (d.ageYears ?? "")}
                  disabled={!!d.dateOfBirth}
                  min={5}
                  max={110}
                  onChange={(e) => set({ ageYears: e.target.value ? Number(e.target.value) : null })}
                />
              </label>
            </div>
            <div>
              {label("ob.about.sex")}
              <div className="grid grid-cols-2 gap-3">
                {(["female", "male"] as const).map((s) => optionCard(d.sexForEquation === s, () => set({ sexForEquation: s }), t(`ob.about.${s}`)))}
              </div>
              <p className="mt-2 text-sm text-muted">{t("ob.about.sexHelp")}</p>
            </div>
            {d.sexForEquation === "female" && (!age || (age >= 15 && age <= 55)) && (
              <div>
                {label("ob.about.pregnancy")}
                <div className="flex flex-wrap gap-2">
                  {(["none", "pregnant", "breastfeeding", "prefer_not"] as const).map((p) => (
                    <Chip key={p} selected={(d.pregnancyStatus ?? "none") === p} onClick={() => set({ pregnancyStatus: p })}>
                      {t(p === "none" ? "ob.about.none" : p === "prefer_not" ? "ob.about.preferNot" : `ob.about.${p}`)}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === "body" && (
          <div className="space-y-6">
            {heading("ob.body.title")}
            <div>
              <div className="mb-2 flex items-center justify-between">
                {label("ob.body.height")}
                <Segmented
                  label={t("ob.body.height")}
                  value={heightUnit}
                  onChange={setHeightUnit}
                  options={[
                    { value: "cm", label: "cm" },
                    { value: "ft", label: "ft / in" },
                  ]}
                />
              </div>
              {heightUnit === "cm" ? (
                <input type="number" inputMode="decimal" className={inputClass} value={d.heightCm ?? ""} placeholder="160" onChange={(e) => set({ heightCm: e.target.value ? Number(e.target.value) : undefined })} />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" inputMode="numeric" aria-label="feet" className={inputClass} value={ftIn.ft || ""} placeholder="5 ft" onChange={(e) => set({ heightCm: Math.round((Number(e.target.value) * 12 + ftIn.inch) * 2.54) })} />
                  <input type="number" inputMode="numeric" aria-label="inches" className={inputClass} value={ftIn.inch || ""} placeholder="4 in" onChange={(e) => set({ heightCm: Math.round((ftIn.ft * 12 + Number(e.target.value)) * 2.54) })} />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                {label("ob.body.weight")}
                <div className="relative">
                  <input type="number" inputMode="decimal" step="0.1" className={inputClass} value={d.weightKg ?? ""} placeholder="70" onChange={(e) => set({ weightKg: e.target.value ? Number(e.target.value) : undefined })} />
                  <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted">kg</span>
                </div>
              </label>
              <label className="block">
                {label("ob.body.target", <Badge>{t("common.optional")}</Badge>)}
                <div className="relative">
                  <input type="number" inputMode="decimal" step="0.1" className={inputClass} value={d.targetWeightKg ?? ""} placeholder="62" onChange={(e) => set({ targetWeightKg: e.target.value ? Number(e.target.value) : null })} />
                  <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm text-muted">kg</span>
                </div>
              </label>
            </div>
            <p className="text-sm text-muted">{t("ob.body.targetHelp")}</p>
            {bmi && bmi > 8 && bmi < 80 && (
              <div className="card-sand flex items-center justify-between px-4 py-3">
                <span className="font-semibold text-forest">{t("ob.body.bmiPreview", { bmi })}</span>
              </div>
            )}
          </div>
        )}

        {step === "activity" && (
          <>
            {heading("ob.activity.title")}
            <div className="grid gap-3">
              {(["sedentary", "light", "moderate", "very"] as const).map((a) =>
                optionCard(d.activityLevel === a, () => set({ activityLevel: a }), t(`activity.${a}`), t(`activity.${a}.desc`)),
              )}
            </div>
          </>
        )}

        {step === "health" && (
          <div className="space-y-6">
            {heading("ob.health.title", "ob.health.body")}
            <div className="flex flex-wrap gap-2">
              <Chip selected={d.conditions.length === 0} onClick={() => set({ conditions: [] })}>
                {t("ob.health.none")}
              </Chip>
              {CONDITION_CODES.map((c) => (
                <Chip key={c} selected={d.conditions.includes(c)} onClick={() => set({ conditions: toggle(d.conditions, c) })}>
                  {t(`cond.${c}`)}
                </Chip>
              ))}
            </div>
            <label className="block">
              {label("ob.health.notes", <Badge>{t("common.optional")}</Badge>)}
              <textarea className={cn(inputClass, "h-24 py-3")} maxLength={500} value={d.medicalNotes ?? ""} onChange={(e) => set({ medicalNotes: e.target.value })} />
            </label>
          </div>
        )}

        {step === "food" && (
          <div className="space-y-6">
            {heading("ob.food.title")}
            <div>
              {label("ob.food.diet")}
              <div className="grid grid-cols-2 gap-3">
                {(["vegetarian", "eggitarian", "non_vegetarian", "vegan"] as const).map((v) => optionCard(d.dietPreference === v, () => set({ dietPreference: v }), t(`diet.${v}`)))}
              </div>
            </div>
            <div>
              {label("ob.food.avoid", <Badge>{t("common.optional")}</Badge>)}
              <div className="flex flex-wrap gap-2">
                {AVOID_TAGS.map((a) => (
                  <Chip key={a} selected={d.avoidFoods.includes(a)} onClick={() => set({ avoidFoods: toggle(d.avoidFoods, a) })}>
                    {t(`avoid.${a}`)}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              {label("ob.food.cuisines", <Badge>{t("common.optional")}</Badge>)}
              <div className="flex flex-wrap gap-2">
                {CUISINES.map((c) => (
                  <Chip key={c} selected={d.cuisines.includes(c)} onClick={() => set({ cuisines: toggle(d.cuisines, c) })}>
                    {t(`cuisine.${c}`)}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              {label("ob.food.allergies", <Badge>{t("common.optional")}</Badge>)}
              <div className="flex flex-wrap gap-2">
                {ALLERGENS.map((a) => (
                  <Chip key={a} selected={d.allergies.includes(a)} onClick={() => set({ allergies: toggle(d.allergies, a) })}>
                    {t(`allergen.${a}`)}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === "kitchen" && (
          <div className="space-y-6">
            {heading("ob.kitchen.title")}
            <div>
              {label("ob.kitchen.time")}
              <div className="flex flex-wrap gap-2">
                {COOKING_TIMES.map((m) => (
                  <Chip key={m} selected={d.cookingTimeMin === m} onClick={() => set({ cookingTimeMin: d.cookingTimeMin === m ? null : m })}>
                    {m === 90 ? "60+" : m} {t("common.min")}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              {label("ob.kitchen.equipment")}
              <div className="flex flex-wrap gap-2">
                {USER_EQUIPMENT.map((e) => (
                  <Chip key={e} selected={d.equipment.includes(e)} onClick={() => set({ equipment: toggle(d.equipment, e) })}>
                    {t(`equip.${e}` as MessageKey)}
                  </Chip>
                ))}
              </div>
              <p className="mt-2 text-sm text-muted">{t("ob.kitchen.equipmentHelp")}</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              {label("ob.kitchen.household")}
              <Stepper label={t("ob.kitchen.household")} value={d.householdSize ?? 1} min={1} max={12} onChange={(v) => set({ householdSize: v })} />
            </div>
            <div>
              {label("ob.kitchen.budget", <Badge>{t("common.optional")}</Badge>)}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted">₹</span>
                  <input type="number" inputMode="numeric" className={cn(inputClass, "pl-8")} value={d.budgetInr ?? ""} placeholder="300" onChange={(e) => set({ budgetInr: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <Segmented
                  label={t("ob.kitchen.budget")}
                  value={d.budgetPeriod ?? "day"}
                  onChange={(v) => set({ budgetPeriod: v })}
                  options={[
                    { value: "day", label: t("ob.kitchen.perDay") },
                    { value: "week", label: t("ob.kitchen.perWeek") },
                  ]}
                />
              </div>
            </div>
          </div>
        )}

        {step === "meals" && (
          <>
            {heading("ob.meals.title", "ob.meals.body")}
            <div className="grid gap-3">
              {MEAL_SLOTS.map((s) => optionCard(d.mealSlots.includes(s), () => set({ mealSlots: MEAL_SLOTS.filter((x) => (x === s ? !d.mealSlots.includes(s) : d.mealSlots.includes(x))) }), t(`slot.${s}`)))}
            </div>
          </>
        )}

        {step === "style" && (
          <div className="space-y-6">
            {heading("ob.style.title")}
            <div className="grid gap-3">
              {PLAN_STYLES.map((s: PlanStyle) => {
                const blocked = screening?.blockedStyles.find((b) => b.style === s);
                return optionCard(d.planStyle === s, () => set({ planStyle: s }), t(`style.${s}`), t(`style.${s}.desc`), !!blocked, blocked ? t("ob.style.blocked", { reason: blocked.reason }) : undefined);
              })}
            </div>
            {d.planStyle === "keto" && (
              <label className="block">
                {label("ob.style.carbLimit")}
                <div className="flex items-center gap-4">
                  <input type="range" min={KETO_NET_CARB_RANGE[0]} max={KETO_NET_CARB_RANGE[1]} step={5} value={d.netCarbLimitG ?? 30} onChange={(e) => set({ netCarbLimitG: Number(e.target.value) })} className="flex-1 accent-[var(--color-forest)]" />
                  <span className="w-16 text-right font-semibold tabular">{d.netCarbLimitG ?? 30} g</span>
                </div>
              </label>
            )}
            {screening?.allowDeficit !== false && d.targetWeightKg && d.weightKg && d.targetWeightKg < d.weightKg && (
              <div>
                {label("ob.style.pace")}
                <div className="grid grid-cols-2 gap-3">
                  {(["gentle", "steady"] as const).map((p) => optionCard((d.pace ?? "gentle") === p, () => set({ pace: p }), t(`ob.style.${p}`), t(`ob.style.${p}.desc`)))}
                </div>
              </div>
            )}
            {screening && screening.flags.length > 0 && (
              <ul className="space-y-2">
                {screening.flags.map((f) => (
                  <li key={f.code} className={cn("rounded-2xl px-4 py-3 text-sm", f.level === "professional" ? "bg-amber-100 text-[#6d4704]" : "bg-sand text-ink-2")}>
                    <span className="font-semibold">{f.title}.</span> {f.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {step === "review" && (
          <div className="text-center">
            <div className="mx-auto mb-6 grid size-20 place-items-center rounded-full bg-lime-100 text-forest">
              <Check className="size-9" strokeWidth={2.5} />
            </div>
            {heading("ob.review.title", "ob.review.body")}
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-terracotta-100 px-3 py-2 text-sm text-terracotta">
          {t((error.startsWith("ob.") || error.startsWith("common.") ? error : "common.error") as MessageKey)}
        </p>
      )}

      <div className="sticky bottom-0 mt-6 flex flex-col gap-2 bg-ivory/90 pt-3 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <Button size="xl" className="w-full" onClick={next} disabled={pending}>
          {pending ? t("common.saving") : step === "review" ? t("ob.finish") : mode === "edit" && i === steps.length - 1 ? t("common.save") : t("common.continue")}
        </Button>
        {OPTIONAL.includes(step) && (
          <Button variant="ghost" onClick={() => setI(i + 1)}>
            {t("common.skip")}
          </Button>
        )}
      </div>
    </div>
  );
}
