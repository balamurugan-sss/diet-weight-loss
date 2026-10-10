import { computeBmi, weightForBmi } from "./bmi";
import { bmrMifflinStJeor, KCAL_PER_KG, tdee as calcTdee } from "./energy";
import { screenHealth, type Screening } from "./safety";
import type { HealthInput, Pace, PlanStyle } from "./types";

export const CALORIE_FLOOR = { female: 1200, male: 1500 } as const;
const PACE_KG_PER_WEEK: Record<Pace, number> = { gentle: 0.25, steady: 0.5 };
const MAX_DEFICIT_FRACTION = 0.2;
export const KETO_NET_CARB_DEFAULT = 30;
export const KETO_NET_CARB_RANGE: [number, number] = [20, 50];
export const LOW_CARB_NET_CARB_DEFAULT = 80;

export type Targets = {
  bmi: number;
  bmr: number;
  maintenanceKcal: number;
  goal: "lose" | "maintain";
  kcal: number;
  kcalMin: number;
  kcalMax: number;
  dailyDeficit: number;
  floorApplied: boolean;
  requestedStyle: PlanStyle;
  style: PlanStyle;
  styleNote: string | null;
  proteinG: number;
  carbsG: number;
  netCarbLimitG: number | null;
  fatG: number;
  fibreG: number;
  waterMl: number;
  waterIsCustom: boolean;
  effectiveTargetKg: number | null;
  weeklyLossKg: [number, number];
  screening: Screening;
};

const r5 = (n: number) => Math.round(n / 5) * 5;

export function computeTargets(input: HealthInput): Targets {
  const screening = screenHealth(input);
  const bmi = computeBmi(input.weightKg, input.heightCm);
  const bmr = bmrMifflinStJeor(input.sex, input.weightKg, input.heightCm, input.ageYears);
  const maintenanceKcal = calcTdee(bmr, input.activity);

  const effectiveTargetKg = input.targetWeightKg
    ? Math.max(input.targetWeightKg, screening.minHealthyTargetKg)
    : null;
  const wantsLoss = effectiveTargetKg !== null && effectiveTargetKg < input.weightKg - 0.5;
  const goal = wantsLoss && screening.allowDeficit ? "lose" : "maintain";

  const floor = CALORIE_FLOOR[input.sex];
  let kcal = maintenanceKcal;
  let floorApplied = false;
  if (goal === "lose") {
    const paceDeficit = (PACE_KG_PER_WEEK[input.pace] * KCAL_PER_KG) / 7;
    const deficit = Math.min(paceDeficit, maintenanceKcal * MAX_DEFICIT_FRACTION);
    kcal = maintenanceKcal - deficit;
    if (kcal < floor) {
      kcal = Math.min(floor, maintenanceKcal);
      floorApplied = true;
    }
  }
  kcal = r5(kcal);
  const dailyDeficit = Math.max(0, maintenanceKcal - kcal);

  let style = input.planStyle;
  let styleNote: string | null = null;
  if (!screening.allowedStyles.includes(style)) {
    const reason = screening.blockedStyles.find((b) => b.style === style)?.reason;
    style = "balanced";
    styleNote = `We've switched you to a balanced plan. ${reason ?? ""}`.trim();
  }

  // Protein is anchored to a reference weight so that higher body weights
  // don't produce excessive targets.
  const refWeight = bmi > 25 ? weightForBmi(25, input.heightCm) : input.weightKg;
  let proteinPerKg = style === "high_protein" ? 1.8 : 1.3;
  if (input.ageYears >= 65) proteinPerKg = Math.max(proteinPerKg, 1.2);
  if (input.conditions.includes("kidney")) proteinPerKg = 0.8;
  if (!screening.isAdult) proteinPerKg = 1.0;
  let proteinG = Math.round(refWeight * proteinPerKg);
  proteinG = Math.min(proteinG, Math.round((kcal * 0.35) / 4));

  let netCarbLimitG: number | null = null;
  let carbsG: number;
  let fibreG = Math.round((kcal / 1000) * 14);
  if (style === "keto") {
    const [lo, hi] = KETO_NET_CARB_RANGE;
    netCarbLimitG = Math.min(hi, Math.max(lo, input.netCarbLimitG ?? KETO_NET_CARB_DEFAULT));
    fibreG = Math.min(Math.max(fibreG, 20), 30);
    carbsG = netCarbLimitG + fibreG;
  } else if (style === "low_carb") {
    netCarbLimitG = Math.min(130, Math.max(50, input.netCarbLimitG ?? LOW_CARB_NET_CARB_DEFAULT));
    fibreG = Math.max(fibreG, 25);
    carbsG = netCarbLimitG + fibreG;
  } else {
    const share = style === "high_protein" ? 0.4 : 0.5;
    carbsG = Math.round((kcal * share) / 4);
    fibreG = Math.max(fibreG, 25);
  }
  fibreG = Math.min(fibreG, 40);

  let fatG = Math.round((kcal - proteinG * 4 - carbsG * 4) / 9);
  const minFat = Math.round((kcal * 0.2) / 9);
  if (fatG < minFat) {
    fatG = minFat;
    carbsG = Math.max(0, Math.round((kcal - proteinG * 4 - fatG * 9) / 4));
  }

  let waterMl: number;
  const waterIsCustom = !!input.waterGoalMl;
  if (input.waterGoalMl) waterMl = input.waterGoalMl;
  else {
    waterMl = Math.round((input.weightKg * 35) / 250) * 250;
    waterMl = Math.min(4000, Math.max(1500, waterMl));
    if (input.pregnancy === "pregnant") waterMl += 300;
    if (input.pregnancy === "breastfeeding") waterMl += 700;
  }

  // Real-world loss is usually slower than the arithmetic predicts.
  const theoretical = (dailyDeficit * 7) / KCAL_PER_KG;
  const weeklyLossKg: [number, number] =
    goal === "lose"
      ? [Math.round(theoretical * 0.6 * 100) / 100, Math.round(theoretical * 100) / 100]
      : [0, 0];

  return {
    bmi,
    bmr,
    maintenanceKcal,
    goal,
    kcal,
    kcalMin: Math.max(goal === "lose" ? floor : 0, kcal - 100),
    kcalMax: kcal + 100,
    dailyDeficit,
    floorApplied,
    requestedStyle: input.planStyle,
    style,
    styleNote,
    proteinG,
    carbsG,
    netCarbLimitG,
    fatG,
    fibreG,
    waterMl,
    waterIsCustom,
    effectiveTargetKg,
    weeklyLossKg,
    screening,
  };
}

export type ProjectionPoint = { week: number; slow: number; fast: number };

/** Weekly weight band from "slower" to "expected" pace, stopping at the target. */
export function projectWeight(
  currentKg: number,
  targetKg: number | null,
  weeklyLossKg: [number, number],
  maxWeeks = 52,
): { points: ProjectionPoint[]; weeksRange: [number, number] | null } {
  const [slowRate, fastRate] = weeklyLossKg;
  if (!targetKg || fastRate <= 0 || targetKg >= currentKg) {
    return { points: [{ week: 0, slow: currentKg, fast: currentKg }], weeksRange: null };
  }
  const toLose = currentKg - targetKg;
  const fastWeeks = Math.ceil(toLose / fastRate);
  const slowWeeks = Math.ceil(toLose / slowRate);
  const horizon = Math.min(maxWeeks, slowWeeks);
  const points: ProjectionPoint[] = [];
  for (let w = 0; w <= horizon; w++) {
    points.push({
      week: w,
      slow: Math.round(Math.max(targetKg, currentKg - slowRate * w) * 10) / 10,
      fast: Math.round(Math.max(targetKg, currentKg - fastRate * w) * 10) / 10,
    });
  }
  return { points, weeksRange: [fastWeeks, slowWeeks] };
}
