"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { useUserStore } from "@/lib/store/userStore";
import { runFullCalculation } from "@/lib/calculations";
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
import { ChipSelect } from "./ChipSelect";
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

type Draft = Partial<UserProfile>;

const DEFAULT_DRAFT: Draft = {
  gender: "female",
  activityLevel: "moderate",
  foodPreference: "vegetarian",
  cuisinePreferences: ["indian"],
  healthConditions: [],
  workoutPreferences: ["home"],
  fitnessLevel: "beginner",
  goal: "weight-loss",
  goalSpeed: "moderate",
  dailySteps: 5000,
  sleepHours: 7,
  waterIntakeLiters: 2,
};

const TOTAL_STEPS = 8;

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(DEFAULT_DRAFT);
  const setProfile = useUserStore((s) => s.setProfile);
  const router = useRouter();

  function update(partial: Draft) {
    setDraft((d) => ({ ...d, ...partial }));
  }

  const preview = useMemo(() => {
    if (!draft.age || !draft.heightCm || !draft.weightKg || !draft.gender || !draft.activityLevel || !draft.goal || !draft.goalSpeed || !draft.targetWeightKg) {
      return null;
    }
    return runFullCalculation(draft as UserProfile);
  }, [draft]);

  const canProceed = useMemo(() => {
    switch (step) {
      case 0:
        return !!draft.name && !!draft.age && draft.age > 0 && !!draft.gender;
      case 1:
        return !!draft.heightCm && !!draft.weightKg && !!draft.targetWeightKg;
      case 2:
        return !!draft.activityLevel;
      case 3:
        return !!draft.foodPreference && (draft.cuisinePreferences?.length ?? 0) > 0;
      case 4:
        return true;
      case 5:
        return (draft.workoutPreferences?.length ?? 0) > 0 && !!draft.fitnessLevel;
      case 6:
        return !!draft.goal && !!draft.goalSpeed;
      default:
        return true;
    }
  }, [step, draft]);

  function next() {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
  }
  function back() {
    if (step > 0) setStep(step - 1);
  }

  function finish() {
    const profile: UserProfile = {
      name: draft.name!,
      age: draft.age!,
      gender: draft.gender!,
      heightCm: draft.heightCm!,
      weightKg: draft.weightKg!,
      targetWeightKg: draft.targetWeightKg!,
      bodyFatPct: draft.bodyFatPct,
      activityLevel: draft.activityLevel!,
      occupation: draft.occupation ?? "",
      dailySteps: draft.dailySteps ?? 5000,
      sleepHours: draft.sleepHours ?? 7,
      waterIntakeLiters: draft.waterIntakeLiters ?? 2,
      foodPreference: draft.foodPreference!,
      cuisinePreferences: draft.cuisinePreferences ?? ["indian"],
      healthConditions: draft.healthConditions ?? [],
      workoutPreferences: draft.workoutPreferences ?? ["home"],
      fitnessLevel: draft.fitnessLevel ?? "beginner",
      goal: draft.goal!,
      goalSpeed: draft.goalSpeed!,
      createdAt: new Date().toISOString(),
    };
    setProfile(profile);
    router.push("/dashboard");
  }

  const progressPct = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-5 py-6">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs" style={{ color: "var(--muted)" }}>
          <span>Step {step + 1} of {TOTAL_STEPS}</span>
          <span>{Math.round(progressPct)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--ring-track)" }}>
          <motion.div
            className="h-full rounded-full gradient-primary"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <div className="glass-card flex-1 p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && <StepBasics draft={draft} update={update} />}
            {step === 1 && <StepBody draft={draft} update={update} />}
            {step === 2 && <StepLifestyle draft={draft} update={update} />}
            {step === 3 && <StepFood draft={draft} update={update} />}
            {step === 4 && <StepHealth draft={draft} update={update} />}
            {step === 5 && <StepWorkout draft={draft} update={update} />}
            {step === 6 && <StepGoal draft={draft} update={update} />}
            {step === 7 && <StepReview draft={draft} preview={preview} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-5 flex gap-3">
        {step > 0 && (
          <button onClick={back} className="btn-secondary flex-1">
            <ArrowLeft size={16} /> Back
          </button>
        )}
        {step < TOTAL_STEPS - 1 ? (
          <button onClick={next} disabled={!canProceed} className="btn-primary flex-1 disabled:opacity-40">
            Continue <ArrowRight size={16} />
          </button>
        ) : (
          <button onClick={finish} className="btn-primary flex-1">
            <Sparkles size={16} /> Create My Plan
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function StepBasics({ draft, update }: { draft: Draft; update: (d: Draft) => void }) {
  return (
    <div>
      <h2 className="mb-1 text-xl font-bold">Let&apos;s get to know you</h2>
      <p className="mb-5 text-sm" style={{ color: "var(--muted)" }}>Basic details to personalize your plan.</p>
      <Field label="Name">
        <input
          className="input-field"
          value={draft.name ?? ""}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="Your name"
        />
      </Field>
      <Field label="Age">
        <input
          type="number"
          className="input-field"
          value={draft.age ?? ""}
          onChange={(e) => update({ age: Number(e.target.value) })}
          placeholder="Years"
        />
      </Field>
      <Field label="Gender">
        <ChipSelect
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
          ]}
          value={draft.gender ? [draft.gender] : []}
          onChange={(v) => update({ gender: v[0] })}
        />
      </Field>
    </div>
  );
}

function StepBody({ draft, update }: { draft: Draft; update: (d: Draft) => void }) {
  return (
    <div>
      <h2 className="mb-1 text-xl font-bold">Your body metrics</h2>
      <p className="mb-5 text-sm" style={{ color: "var(--muted)" }}>Used to calculate your BMI, BMR & calorie needs.</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Height (cm)">
          <input type="number" className="input-field" value={draft.heightCm ?? ""} onChange={(e) => update({ heightCm: Number(e.target.value) })} placeholder="170" />
        </Field>
        <Field label="Weight (kg)">
          <input type="number" className="input-field" value={draft.weightKg ?? ""} onChange={(e) => update({ weightKg: Number(e.target.value) })} placeholder="75" />
        </Field>
      </div>
      <Field label="Target Weight (kg)">
        <input type="number" className="input-field" value={draft.targetWeightKg ?? ""} onChange={(e) => update({ targetWeightKg: Number(e.target.value) })} placeholder="65" />
      </Field>
      <Field label="Body Fat % (optional)">
        <input type="number" className="input-field" value={draft.bodyFatPct ?? ""} onChange={(e) => update({ bodyFatPct: e.target.value ? Number(e.target.value) : undefined })} placeholder="e.g. 28" />
      </Field>
    </div>
  );
}

function StepLifestyle({ draft, update }: { draft: Draft; update: (d: Draft) => void }) {
  return (
    <div>
      <h2 className="mb-1 text-xl font-bold">Your lifestyle</h2>
      <p className="mb-5 text-sm" style={{ color: "var(--muted)" }}>Helps us set accurate calorie & activity targets.</p>
      <Field label="Activity Level">
        <ChipSelect
          options={ACTIVITY_LEVEL_OPTIONS}
          value={draft.activityLevel ? [draft.activityLevel] : []}
          onChange={(v: ActivityLevel[]) => update({ activityLevel: v[0] })}
          columns={1}
        />
      </Field>
      <Field label="Occupation">
        <input className="input-field" value={draft.occupation ?? ""} onChange={(e) => update({ occupation: e.target.value })} placeholder="e.g. Software Engineer" />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Steps/day">
          <input type="number" className="input-field" value={draft.dailySteps ?? ""} onChange={(e) => update({ dailySteps: Number(e.target.value) })} />
        </Field>
        <Field label="Sleep (h)">
          <input type="number" className="input-field" value={draft.sleepHours ?? ""} onChange={(e) => update({ sleepHours: Number(e.target.value) })} />
        </Field>
        <Field label="Water (L)">
          <input type="number" step="0.1" className="input-field" value={draft.waterIntakeLiters ?? ""} onChange={(e) => update({ waterIntakeLiters: Number(e.target.value) })} />
        </Field>
      </div>
    </div>
  );
}

function StepFood({ draft, update }: { draft: Draft; update: (d: Draft) => void }) {
  return (
    <div>
      <h2 className="mb-1 text-xl font-bold">Food preferences</h2>
      <p className="mb-5 text-sm" style={{ color: "var(--muted)" }}>We&apos;ll tailor recipes & meal plans to match.</p>
      <Field label="Diet Type">
        <ChipSelect
          options={FOOD_PREFERENCE_OPTIONS}
          value={draft.foodPreference ? [draft.foodPreference] : []}
          onChange={(v: FoodPreference[]) => update({ foodPreference: v[0] })}
        />
      </Field>
      <Field label="Cuisine Preferences (select all that apply)">
        <ChipSelect
          options={CUISINE_OPTIONS}
          value={draft.cuisinePreferences ?? []}
          onChange={(v: CuisinePreference[]) => update({ cuisinePreferences: v })}
          multi
        />
      </Field>
    </div>
  );
}

function StepHealth({ draft, update }: { draft: Draft; update: (d: Draft) => void }) {
  return (
    <div>
      <h2 className="mb-1 text-xl font-bold">Health conditions</h2>
      <p className="mb-5 text-sm" style={{ color: "var(--muted)" }}>
        Optional — we&apos;ll adapt meals & workouts to be safe for you.
      </p>
      <ChipSelect
        options={HEALTH_CONDITION_OPTIONS}
        value={draft.healthConditions ?? []}
        onChange={(v: HealthCondition[]) => update({ healthConditions: v })}
        multi
      />
    </div>
  );
}

function StepWorkout({ draft, update }: { draft: Draft; update: (d: Draft) => void }) {
  return (
    <div>
      <h2 className="mb-1 text-xl font-bold">Workout preferences</h2>
      <p className="mb-5 text-sm" style={{ color: "var(--muted)" }}>What do you enjoy or have access to?</p>
      <Field label="Workout Types (select all that apply)">
        <ChipSelect
          options={WORKOUT_PREFERENCE_OPTIONS}
          value={draft.workoutPreferences ?? []}
          onChange={(v: WorkoutPreference[]) => update({ workoutPreferences: v })}
          multi
          columns={3}
        />
      </Field>
      <Field label="Fitness Level">
        <ChipSelect
          options={[...FITNESS_LEVEL_OPTIONS]}
          value={draft.fitnessLevel ? [draft.fitnessLevel] : []}
          onChange={(v) => update({ fitnessLevel: v[0] as UserProfile["fitnessLevel"] })}
          columns={3}
        />
      </Field>
    </div>
  );
}

function StepGoal({ draft, update }: { draft: Draft; update: (d: Draft) => void }) {
  return (
    <div>
      <h2 className="mb-1 text-xl font-bold">Your goal</h2>
      <p className="mb-5 text-sm" style={{ color: "var(--muted)" }}>What are you working towards?</p>
      <Field label="Goal">
        <ChipSelect
          options={GOAL_OPTIONS}
          value={draft.goal ? [draft.goal] : []}
          onChange={(v: Goal[]) => update({ goal: v[0] })}
          columns={1}
        />
      </Field>
      <Field label="Goal Speed">
        <ChipSelect
          options={GOAL_SPEED_OPTIONS}
          value={draft.goalSpeed ? [draft.goalSpeed] : []}
          onChange={(v: GoalSpeed[]) => update({ goalSpeed: v[0] })}
          columns={1}
        />
      </Field>
    </div>
  );
}

function StepReview({ draft, preview }: { draft: Draft; preview: ReturnType<typeof runFullCalculation> | null }) {
  return (
    <div>
      <h2 className="mb-1 text-xl font-bold">Your personalized plan</h2>
      <p className="mb-5 text-sm" style={{ color: "var(--muted)" }}>
        Here&apos;s what FitFusion AI calculated for {draft.name || "you"}.
      </p>
      {preview ? (
        <div className="grid grid-cols-2 gap-3">
          <Stat label="BMI" value={`${preview.bmi}`} sub={preview.bmiCategory} />
          <Stat label="Daily Calories" value={`${preview.dailyCalories}`} sub="kcal/day" />
          <Stat label="Protein" value={`${preview.proteinG}g`} />
          <Stat label="Carbs" value={`${preview.carbsG}g`} />
          <Stat label="Healthy Fat" value={`${preview.fatG}g`} />
          <Stat label="Fiber" value={`${preview.fiberG}g`} />
          <Stat label="Water Target" value={`${preview.waterLiters}L`} />
          <Stat label="Step Goal" value={`${preview.recommendedSteps.toLocaleString()}`} />
          <Stat label="BMR / TDEE" value={`${preview.bmr} / ${preview.tdee}`} />
          <Stat label="Target Date" value={preview.targetDate} sub={`${preview.weeksToGoal} weeks`} />
        </div>
      ) : (
        <p className="text-sm" style={{ color: "var(--muted)" }}>Fill in your details to see your plan.</p>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="solid-card p-3">
      <p className="text-[11px] font-medium" style={{ color: "var(--muted)" }}>{label}</p>
      <p className="text-lg font-bold gradient-text">{value}</p>
      {sub && <p className="text-[11px]" style={{ color: "var(--muted)" }}>{sub}</p>}
    </div>
  );
}
