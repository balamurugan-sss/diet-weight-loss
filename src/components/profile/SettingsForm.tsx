"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Segmented } from "@/components/ui/Stepper";
import { AVAILABLE_LANGUAGES } from "@/lib/i18n/languages";
import { savePreferences, setThemeAction } from "@/server/actions/profile";

type Prefs = { language: string; transliteration: boolean; units: "metric" | "kitchen"; narrationRate: number; keepAwake: boolean; voiceCommands: boolean; waterGoalMl: number | null };

export function SettingsForm({ initial, guidelineMl, theme }: { initial: Prefs; guidelineMl: number; theme: "dark" | "light" }) {
  const { t } = useI18n();
  const router = useRouter();
  const [p, setP] = useState(initial);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const save = (patch: Partial<Prefs>) => {
    setP((x) => ({ ...x, ...patch }));
    setSaved(false);
    start(async () => {
      await savePreferences(patch);
      setSaved(true);
      router.refresh();
    });
  };
  const row = (label: string, control: React.ReactNode, help?: string) => (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{label}</p>
        {help && <p className="text-sm text-muted">{help}</p>}
      </div>
      {control}
    </div>
  );
  const toggle = (checked: boolean, onChange: (v: boolean) => void, label: string) => (
    <input type="checkbox" role="switch" aria-label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-6 accent-[var(--color-forest)]" />
  );
  return (
    <div className="card px-4">
      {row(
        t("settings.theme"),
        <Segmented
          label={t("settings.theme")}
          value={theme}
          onChange={(v) => start(async () => (await setThemeAction(v), router.refresh()))}
          options={[
            { value: "dark", label: t("settings.theme.dark") },
            { value: "light", label: t("settings.theme.light") },
          ]}
        />,
      )}
      {row(
        t("settings.language"),
        <select value={p.language} onChange={(e) => save({ language: e.target.value })} className="h-11 rounded-2xl border border-line bg-surface px-3" aria-label={t("settings.language")}>
          {AVAILABLE_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.nativeName}
            </option>
          ))}
        </select>,
      )}
      {row(t("settings.transliteration"), toggle(p.transliteration, (v) => save({ transliteration: v }), t("settings.transliteration")), t("settings.transliterationHelp"))}
      {row(
        t("settings.units"),
        <Segmented label={t("settings.units")} value={p.units} onChange={(v) => save({ units: v })} options={[{ value: "kitchen", label: t("recipe.units.kitchen") }, { value: "metric", label: t("recipe.units.metric") }]} />,
      )}
      {row(
        t("settings.narrationRate"),
        <Segmented label={t("settings.narrationRate")} value={String(p.narrationRate)} onChange={(v) => save({ narrationRate: Number(v) })} options={["0.75", "1", "1.25", "1.5"].map((v) => ({ value: v, label: `${v}×` }))} />,
      )}
      {row(t("settings.keepAwake"), toggle(p.keepAwake, (v) => save({ keepAwake: v }), t("settings.keepAwake")))}
      {row(t("settings.voiceCommands"), toggle(p.voiceCommands, (v) => save({ voiceCommands: v }), t("settings.voiceCommands")), t("cook.how4"))}
      {row(
        t("settings.waterGoal"),
        <div className="flex items-center gap-2">
          <select
            value={p.waterGoalMl ?? ""}
            onChange={(e) => save({ waterGoalMl: e.target.value ? Number(e.target.value) : null })}
            className="h-11 rounded-2xl border border-line bg-surface px-3"
            aria-label={t("settings.waterGoal")}
          >
            <option value="">
              {t("settings.waterAuto")} ({(guidelineMl / 1000).toFixed(1)} L)
            </option>
            {[1500, 2000, 2250, 2500, 2750, 3000, 3500, 4000].map((ml) => (
              <option key={ml} value={ml}>
                {(ml / 1000).toFixed(2).replace(/0$/, "")} L
              </option>
            ))}
          </select>
        </div>,
        t("targets.waterHelp"),
      )}
      <p className="py-2 text-right text-xs text-muted" aria-live="polite">
        {pending ? t("common.saving") : saved ? "✓" : ""}
      </p>
    </div>
  );
}
