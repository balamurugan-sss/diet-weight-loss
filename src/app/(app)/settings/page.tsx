"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Download, Trash2, Check } from "lucide-react";
import { useUserStore } from "@/lib/store/userStore";
import { useTrackerStore } from "@/lib/store/trackerStore";
import { usePlanStore } from "@/lib/store/planStore";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { useChatStore } from "@/lib/store/chatStore";
import { ChipSelect } from "@/components/onboarding/ChipSelect";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { kgToLb, lbToKg, cmToFeetInches, feetInchesToCm } from "@/lib/units";
import type {
  ActivityLevel,
  CuisinePreference,
  FoodPreference,
  Goal,
  GoalSpeed,
  HealthCondition,
  UserProfile,
  WorkoutPreference,
} from "@/types";
import {
  ACTIVITY_LEVEL_OPTIONS,
  CUISINE_OPTIONS,
  FITNESS_LEVEL_OPTIONS,
  FOOD_PREFERENCE_OPTIONS,
  GOAL_OPTIONS,
  GOAL_SPEED_OPTIONS,
  HEALTH_CONDITION_OPTIONS,
  WORKOUT_PREFERENCE_OPTIONS,
} from "@/lib/data/onboardingOptions";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-6">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const clearProfile = useUserStore((s) => s.clearProfile);
  const units = useSettingsStore((s) => s.units);
  const setUnits = useSettingsStore((s) => s.setUnits);
  const router = useRouter();

  const [draft, setDraft] = useState<UserProfile | null>(profile);
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!profile || !draft) return null;

  function update(partial: Partial<UserProfile>) {
    setDraft((d) => (d ? { ...d, ...partial } : d));
    setSaved(false);
  }

  function save() {
    if (!draft) return;
    updateProfile(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function exportData() {
    const data = {
      profile,
      trackerLogs: useTrackerStore.getState().logs,
      mealPlan: usePlanStore.getState().mealPlan,
      workoutPlan: usePlanStore.getState().workoutPlan,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fitfusion-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function resetApp() {
    clearProfile();
    useTrackerStore.setState({ logs: {} });
    usePlanStore.setState({ mealPlan: null, workoutPlan: null, shoppingList: [] });
    useChatStore.setState({ messages: [] });
    router.push("/onboarding");
  }

  const heightFeetInches = cmToFeetInches(draft.heightCm);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 pb-10">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Manage your profile, preferences, and data.</p>
      </div>

      <Section title="Personal Info">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium">Units</span>
          <div className="flex gap-2">
            <button onClick={() => setUnits("metric")} className={units === "metric" ? "chip chip-active" : "chip"}>Metric (kg/cm)</button>
            <button onClick={() => setUnits("imperial")} className={units === "imperial" ? "chip chip-active" : "chip"}>Imperial (lb/ft)</button>
          </div>
        </div>

        <Field label="Name">
          <input className="input-field" value={draft.name} onChange={(e) => update({ name: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Age">
            <input type="number" className="input-field" value={draft.age} onChange={(e) => update({ age: Number(e.target.value) })} />
          </Field>
          <Field label="Gender">
            <ChipSelect
              options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]}
              value={[draft.gender]}
              onChange={(v) => update({ gender: v[0] })}
            />
          </Field>
        </div>

        {units === "metric" ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Height (cm)">
              <input type="number" className="input-field" value={draft.heightCm} onChange={(e) => update({ heightCm: Number(e.target.value) })} />
            </Field>
            <Field label="Weight (kg)">
              <input type="number" className="input-field" value={draft.weightKg} onChange={(e) => update({ weightKg: Number(e.target.value) })} />
            </Field>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Height (ft / in)">
              <div className="flex gap-2">
                <input
                  type="number"
                  className="input-field"
                  value={heightFeetInches.feet}
                  onChange={(e) => update({ heightCm: feetInchesToCm(Number(e.target.value), heightFeetInches.inches) })}
                />
                <input
                  type="number"
                  className="input-field"
                  value={heightFeetInches.inches}
                  onChange={(e) => update({ heightCm: feetInchesToCm(heightFeetInches.feet, Number(e.target.value)) })}
                />
              </div>
            </Field>
            <Field label="Weight (lb)">
              <input
                type="number"
                className="input-field"
                value={kgToLb(draft.weightKg)}
                onChange={(e) => update({ weightKg: lbToKg(Number(e.target.value)) })}
              />
            </Field>
          </div>
        )}

        <Field label={`Target Weight (${units === "metric" ? "kg" : "lb"})`}>
          <input
            type="number"
            className="input-field"
            value={units === "metric" ? draft.targetWeightKg : kgToLb(draft.targetWeightKg)}
            onChange={(e) =>
              update({ targetWeightKg: units === "metric" ? Number(e.target.value) : lbToKg(Number(e.target.value)) })
            }
          />
        </Field>
        <Field label="Body Fat % (optional)">
          <input
            type="number"
            className="input-field"
            value={draft.bodyFatPct ?? ""}
            onChange={(e) => update({ bodyFatPct: e.target.value ? Number(e.target.value) : undefined })}
          />
        </Field>
      </Section>

      <Section title="Lifestyle">
        <Field label="Activity Level">
          <ChipSelect
            options={ACTIVITY_LEVEL_OPTIONS}
            value={[draft.activityLevel]}
            onChange={(v: ActivityLevel[]) => update({ activityLevel: v[0] })}
            columns={1}
          />
        </Field>
        <Field label="Occupation">
          <input className="input-field" value={draft.occupation} onChange={(e) => update({ occupation: e.target.value })} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Steps/day">
            <input type="number" className="input-field" value={draft.dailySteps} onChange={(e) => update({ dailySteps: Number(e.target.value) })} />
          </Field>
          <Field label="Sleep (h)">
            <input type="number" className="input-field" value={draft.sleepHours} onChange={(e) => update({ sleepHours: Number(e.target.value) })} />
          </Field>
          <Field label="Water (L)">
            <input type="number" step="0.1" className="input-field" value={draft.waterIntakeLiters} onChange={(e) => update({ waterIntakeLiters: Number(e.target.value) })} />
          </Field>
        </div>
      </Section>

      <Section title="Food Preferences">
        <Field label="Diet Type">
          <ChipSelect
            options={FOOD_PREFERENCE_OPTIONS}
            value={[draft.foodPreference]}
            onChange={(v: FoodPreference[]) => update({ foodPreference: v[0] })}
          />
        </Field>
        <Field label="Cuisine Preferences">
          <ChipSelect
            options={CUISINE_OPTIONS}
            value={draft.cuisinePreferences}
            onChange={(v: CuisinePreference[]) => update({ cuisinePreferences: v })}
            multi
          />
        </Field>
      </Section>

      <Section title="Health Conditions">
        <ChipSelect
          options={HEALTH_CONDITION_OPTIONS}
          value={draft.healthConditions}
          onChange={(v: HealthCondition[]) => update({ healthConditions: v })}
          multi
        />
      </Section>

      <Section title="Workout Preferences">
        <Field label="Workout Types">
          <ChipSelect
            options={WORKOUT_PREFERENCE_OPTIONS}
            value={draft.workoutPreferences}
            onChange={(v: WorkoutPreference[]) => update({ workoutPreferences: v })}
            multi
            columns={3}
          />
        </Field>
        <Field label="Fitness Level">
          <ChipSelect
            options={[...FITNESS_LEVEL_OPTIONS]}
            value={[draft.fitnessLevel]}
            onChange={(v) => update({ fitnessLevel: v[0] as UserProfile["fitnessLevel"] })}
            columns={3}
          />
        </Field>
      </Section>

      <Section title="Goal">
        <Field label="Goal">
          <ChipSelect options={GOAL_OPTIONS} value={[draft.goal]} onChange={(v: Goal[]) => update({ goal: v[0] })} columns={1} />
        </Field>
        <Field label="Goal Speed">
          <ChipSelect options={GOAL_SPEED_OPTIONS} value={[draft.goalSpeed]} onChange={(v: GoalSpeed[]) => update({ goalSpeed: v[0] })} columns={1} />
        </Field>
      </Section>

      <Section title="Appearance">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Theme</span>
          <ThemeToggle />
        </div>
      </Section>

      <Section title="Data Management">
        <div className="flex flex-col gap-3">
          <button onClick={exportData} className="btn-secondary self-start !py-2 text-sm">
            <Download size={14} /> Export My Data (JSON)
          </button>
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)} className="btn-secondary self-start !py-2 text-sm" style={{ color: "var(--accent)" }}>
              <Trash2 size={14} /> Reset App
            </button>
          ) : (
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--accent)" }}>
              <p className="mb-3 text-sm">This deletes your profile, logs, and plans from this device. This cannot be undone.</p>
              <div className="flex gap-2">
                <button onClick={resetApp} className="btn-primary !py-2 text-sm" style={{ backgroundImage: "linear-gradient(135deg, var(--accent), #ef4444)" }}>
                  Confirm Reset
                </button>
                <button onClick={() => setConfirmReset(false)} className="btn-secondary !py-2 text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </Section>

      <button onClick={save} className="btn-primary sticky bottom-20 lg:bottom-4">
        {saved ? <Check size={16} /> : <Save size={16} />} {saved ? "Saved!" : "Save Changes"}
      </button>
    </div>
  );
}
