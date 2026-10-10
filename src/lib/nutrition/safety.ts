import { computeBmi, weightForBmi } from "./bmi";
import type { HealthInput, PlanStyle } from "./types";

export type FlagLevel = "info" | "caution" | "professional";

export type SafetyFlag = {
  code: string;
  level: FlagLevel;
  title: string;
  message: string;
};

export type Screening = {
  supported: boolean;
  isAdult: boolean;
  allowDeficit: boolean;
  allowedStyles: PlanStyle[];
  blockedStyles: { style: PlanStyle; reason: string }[];
  flags: SafetyFlag[];
  requiresProfessional: boolean;
  minHealthyTargetKg: number;
};

type ScreenInput = Pick<
  HealthInput,
  "ageYears" | "heightCm" | "weightKg" | "targetWeightKg" | "conditions" | "pregnancy"
>;

export function screenHealth(input: ScreenInput): Screening {
  const flags: SafetyFlag[] = [];
  const blocked = new Map<PlanStyle, string>();
  const has = (c: string) => input.conditions.includes(c);
  const block = (style: PlanStyle, reason: string) => {
    if (!blocked.has(style)) blocked.set(style, reason);
  };
  let allowDeficit = true;

  const bmi = computeBmi(input.weightKg, input.heightCm);
  const minHealthyTargetKg = Math.ceil(weightForBmi(18.5, input.heightCm) * 2) / 2;
  const supported = input.ageYears >= 13;
  const isAdult = input.ageYears >= 18;

  if (!supported) {
    flags.push({
      code: "under_13",
      level: "professional",
      title: "This app isn't designed for children",
      message:
        "Nutrition for children should be planned with a paediatrician. You can still browse recipes as family meals.",
    });
    allowDeficit = false;
  } else if (!isAdult) {
    flags.push({
      code: "teen",
      level: "professional",
      title: "Growing bodies need enough energy",
      message:
        "For under-18s we only offer balanced family meal plans at maintenance calories — no calorie deficits or restrictive diets. Please talk to a paediatrician or registered dietitian about weight.",
    });
    allowDeficit = false;
  }

  if (!isAdult) {
    block("keto", "Not suitable under 18.");
    block("low_carb", "Not suitable under 18.");
    block("high_protein", "Not suitable under 18.");
  }

  if (input.pregnancy === "pregnant" || input.pregnancy === "breastfeeding") {
    const label = input.pregnancy === "pregnant" ? "pregnancy" : "breastfeeding";
    flags.push({
      code: input.pregnancy,
      level: "professional",
      title: `Plans are set to maintenance during ${label}`,
      message: `Energy and nutrient needs rise during ${label}. We won't create a calorie deficit or restrictive plan — please follow your doctor's or dietitian's guidance.`,
    });
    allowDeficit = false;
    for (const s of ["keto", "low_carb", "high_protein"] as const)
      block(s, `Not recommended during ${label}.`);
  }

  if (has("diabetes_meds")) {
    flags.push({
      code: "diabetes_meds",
      level: "professional",
      title: "Check with your doctor before cutting carbs",
      message:
        "If you take insulin or other glucose-lowering medicines (including SGLT2 inhibitors), lowering carbohydrates can cause dangerous low blood sugar or ketoacidosis unless your doses are adjusted. We've set a balanced plan; please speak to your diabetes care team before any low-carb or ketogenic diet.",
    });
    block("keto", "Needs medication review by your doctor first.");
    block("low_carb", "Needs medication review by your doctor first.");
  }
  if (has("diabetes_diet")) {
    flags.push({
      code: "diabetes_diet",
      level: "caution",
      title: "Monitor your blood sugar",
      message:
        "Changing your diet can change your glucose readings. Keep up regular checks and share your plan with your doctor.",
    });
  }
  if (has("kidney")) {
    flags.push({
      code: "kidney",
      level: "professional",
      title: "Kidney health needs individual advice",
      message:
        "Protein, potassium, phosphorus and fluid needs vary with kidney function. We've avoided high-protein and ketogenic plans — please plan your diet with a nephrologist or renal dietitian.",
    });
    block("keto", "Not suitable with kidney disease without specialist approval.");
    block("high_protein", "Not suitable with kidney disease without specialist approval.");
  }
  if (has("liver")) {
    flags.push({
      code: "liver",
      level: "professional",
      title: "Liver conditions need medical guidance",
      message: "Please discuss any weight-loss diet with your hepatologist or doctor.",
    });
    block("keto", "Not suitable with liver disease without specialist approval.");
  }
  if (has("gallbladder") || has("pancreatitis")) {
    flags.push({
      code: "high_fat_risk",
      level: "professional",
      title: "High-fat diets may not suit you",
      message:
        "Very high-fat eating can trigger symptoms with gallbladder disease or pancreatitis. Please check with your doctor.",
    });
    block("keto", "High-fat diets are not advised with this condition.");
  }
  if (has("heart_disease")) {
    flags.push({
      code: "heart_disease",
      level: "professional",
      title: "Heart health first",
      message:
        "Plans favour unsaturated fats and limit saturated fat. Please review any restrictive diet with your cardiologist.",
    });
    block("keto", "Discuss with your cardiologist first.");
  }
  if (has("gout")) {
    flags.push({
      code: "gout",
      level: "caution",
      title: "Gout",
      message: "Very high-protein and ketogenic diets can raise uric acid. Stay well hydrated and check with your doctor.",
    });
    block("keto", "Can raise uric acid levels.");
  }
  if (has("eating_disorder")) {
    flags.push({
      code: "eating_disorder",
      level: "professional",
      title: "We'll keep things gentle",
      message:
        "Calorie targets and restrictive diets can be unhelpful after an eating disorder. We'll plan balanced meals at maintenance. If you'd like support, please reach out to a healthcare professional.",
    });
    allowDeficit = false;
    for (const s of ["keto", "low_carb", "high_protein"] as const)
      block(s, "We don't offer restrictive plans here.");
  }
  if (has("hypertension")) {
    flags.push({
      code: "hypertension",
      level: "info",
      title: "Watch the salt",
      message: "Recipes show salt quantities — use the lower end, and favour fresh over packaged foods.",
    });
  }
  if (has("thyroid") || has("pcos")) {
    flags.push({
      code: "endocrine",
      level: "info",
      title: "Keep up your treatment",
      message: "Diet changes work alongside, not instead of, your prescribed treatment.",
    });
  }

  if (bmi < 18.5 && isAdult) {
    flags.push({
      code: "underweight",
      level: "professional",
      title: "Your BMI is below the healthy range",
      message:
        "We won't create a calorie deficit. If weight loss has been unintentional, please see a doctor.",
    });
    allowDeficit = false;
    block("keto", "Not suitable when underweight.");
  }

  if (input.targetWeightKg && input.targetWeightKg < minHealthyTargetKg) {
    flags.push({
      code: "target_too_low",
      level: "caution",
      title: "Your target is below a healthy weight",
      message: `For your height, a BMI of 18.5 is about ${minHealthyTargetKg} kg. We'll plan towards that instead.`,
    });
  }

  if (bmi >= 40 && isAdult) {
    flags.push({
      code: "bmi_40",
      level: "professional",
      title: "Medical support can help",
      message:
        "At this BMI, a doctor can offer extra support and check for related conditions before you start.",
    });
  }

  if (input.ageYears >= 65) {
    flags.push({
      code: "older_adult",
      level: "info",
      title: "Protein matters more with age",
      message: "We keep protein at least 1.2 g/kg to help protect muscle. Avoid large deficits.",
    });
  }

  const allStyles: PlanStyle[] = ["balanced", "low_carb", "keto", "high_protein"];
  return {
    supported,
    isAdult,
    allowDeficit,
    allowedStyles: allStyles.filter((s) => !blocked.has(s)),
    blockedStyles: [...blocked].map(([style, reason]) => ({ style, reason })),
    flags,
    requiresProfessional: flags.some((f) => f.level === "professional"),
    minHealthyTargetKg,
  };
}
