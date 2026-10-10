export function computeBmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export type BmiCategoryId =
  | "underweight"
  | "healthy"
  | "overweight"
  | "obesity_1"
  | "obesity_2"
  | "obesity_3";

export type BmiBand = { id: BmiCategoryId; label: string; min: number; max: number };

// WHO adult classification.
export const WHO_BANDS: BmiBand[] = [
  { id: "underweight", label: "Underweight", min: 0, max: 18.5 },
  { id: "healthy", label: "Healthy weight", min: 18.5, max: 25 },
  { id: "overweight", label: "Overweight", min: 25, max: 30 },
  { id: "obesity_1", label: "Obesity (class I)", min: 30, max: 35 },
  { id: "obesity_2", label: "Obesity (class II)", min: 35, max: 40 },
  { id: "obesity_3", label: "Obesity (class III)", min: 40, max: Infinity },
];

// Consensus guideline thresholds for Asian Indian adults (Misra et al., 2009),
// reflecting higher cardiometabolic risk at lower BMI.
export const ASIAN_INDIAN_BANDS: BmiBand[] = [
  { id: "underweight", label: "Underweight", min: 0, max: 18.5 },
  { id: "healthy", label: "Normal", min: 18.5, max: 23 },
  { id: "overweight", label: "Overweight", min: 23, max: 25 },
  { id: "obesity_1", label: "Obesity", min: 25, max: Infinity },
];

function band(bmi: number, bands: BmiBand[]) {
  return bands.find((b) => bmi >= b.min && bmi < b.max) ?? bands[bands.length - 1];
}

export type BmiAssessment =
  | {
      kind: "adult";
      bmi: number;
      who: BmiBand;
      asianIndian: BmiBand;
      healthyRangeKg: [number, number];
    }
  | { kind: "under18"; bmi: number; message: string };

export function weightForBmi(bmi: number, heightCm: number) {
  const m = heightCm / 100;
  return bmi * m * m;
}

export function assessBmi(weightKg: number, heightCm: number, ageYears: number): BmiAssessment {
  const bmi = computeBmi(weightKg, heightCm);
  if (ageYears < 18) {
    return {
      kind: "under18",
      bmi,
      message:
        "Adult BMI categories do not apply under 18. Children and teenagers are assessed with age- and sex-specific BMI-for-age growth charts (WHO or IAP), which a paediatrician or registered dietitian can interpret alongside growth history.",
    };
  }
  return {
    kind: "adult",
    bmi,
    who: band(bmi, WHO_BANDS),
    asianIndian: band(bmi, ASIAN_INDIAN_BANDS),
    healthyRangeKg: [
      Math.ceil(weightForBmi(18.5, heightCm) * 10) / 10,
      Math.floor(weightForBmi(24.9, heightCm) * 10) / 10,
    ],
  };
}

export const BMI_LIMITATIONS = [
  "BMI does not distinguish muscle from fat, so muscular people can be classed as overweight.",
  "It does not show where fat is stored. Waist size is a useful extra check — for Indian adults, a waist above 90 cm (men) or 80 cm (women) suggests higher risk.",
  "It is less accurate for older adults, pregnant people, and some ethnic groups.",
  "It is a screening number, not a diagnosis. A healthcare professional can give a fuller picture.",
];
