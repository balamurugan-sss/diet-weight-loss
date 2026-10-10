import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/Card";
import { WorkoutSetupForm, type SetupDefaults } from "@/components/workouts/WorkoutSetupForm";
import type { DaysPerWeek } from "@/lib/workouts/types";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";
import { targetsForProfile } from "@/server/services/targets";
import { getWorkoutProfile, workoutSafety } from "@/server/services/workouts";

export const metadata = { title: "Set up workouts" };

export default async function WorkoutSetupPage() {
  const { user, profile } = await requireOnboarded();
  const { t } = await getI18n();
  const wp = await getWorkoutProfile(user.id);
  // The workout goal is pre-filled from the food plan: losing weight → weight loss, otherwise stay fit.
  const foodGoal = targetsForProfile(profile)?.goal === "lose" ? "lose" : "fit";
  const defaults: SetupDefaults = wp
    ? { location: wp.location, level: wp.level, goal: wp.goal, daysPerWeek: wp.daysPerWeek as DaysPerWeek, equipment: wp.equipment }
    : { location: "home", level: "beginner", goal: foodGoal, daysPerWeek: 3, equipment: [] };

  return (
    <div className="mx-auto max-w-2xl">
      {wp && (
        <Link href="/workouts" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-forest">
          <ArrowLeft className="size-4" aria-hidden /> {t("wk.title")}
        </Link>
      )}
      <PageHeader title={t("wk.setup.title")} subtitle={t("wk.setup.subtitle")} />
      <WorkoutSetupForm defaults={defaults} foodGoal={foodGoal} cautions={workoutSafety(profile).cautions} existing={!!wp} />
    </div>
  );
}
