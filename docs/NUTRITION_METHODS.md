# Nutrition methods

All logic lives in `src/lib/nutrition/*` and is covered by `tests/nutrition.test.ts`.

## BMI
`BMI = weight (kg) / height (m)²`, rounded to 0.1. Shown with:
- **WHO adult categories** (underweight < 18.5, healthy 18.5–24.9, overweight 25–29.9, obesity I/II/III).
- **Asian-Indian consensus cut-offs** (Misra et al., 2009): normal 18.5–22.9, overweight 23–24.9, obesity ≥ 25.
- The healthy weight range for the user's height and the limitations of BMI.
- Under 18: adult categories are not applied; the user is told that BMI-for-age growth charts are needed.

## Energy
- BMR: **Mifflin–St Jeor**. Women: `10W + 6.25H − 5A − 161`; men: `+5`.
- Maintenance: BMR × activity factor (1.2 / 1.375 / 1.55 / 1.725).
- Weight loss (only when the safety screen allows a deficit and the target is below current weight):
  - Pace *gentle* ≈ 0.25 kg/week or *steady* ≈ 0.5 kg/week (7,700 kcal/kg),
  - deficit capped at **20% of maintenance**,
  - never below **1,200 kcal (women) / 1,500 kcal (men)**. No plan is ever set at 1,000 kcal.
- The daily target is shown as a ±100 kcal range.
- Expected loss is shown as a **range** (60–100% of the arithmetic rate) and a weeks range — never a promise.

## Macros
- Protein: 1.3 g/kg (balanced), 1.5 g/kg (low-carb/keto), 1.8 g/kg (high-protein) of a **reference weight**
  (weight at BMI 25 when BMI > 25), min 1.2 g/kg at age ≥ 65, 0.8 g/kg with kidney disease, capped at 35% of energy.
- Carbohydrate: 50% of energy (balanced), 40% (high-protein); moderate low-carb sets a net-carb limit of
  50–130 g (default 80); keto 20–50 g net (default 30).
- Fat: the remainder, never below 20% of energy.
- Fibre: 14 g per 1,000 kcal, floor 25 g (20 g on keto), cap 40 g.
- Water: 35 ml/kg rounded to 250 ml, 1.5–4 L, +300 ml pregnant, +700 ml breastfeeding — shown as an adjustable guideline.

## Net carbohydrates
`net carbs = total carbohydrate − dietary fibre − sugar alcohols` (never negative).
Ingredient tables store **total** carbohydrate *including* fibre; IFCT 2017 "available carbohydrate"
values had fibre added back so every source follows the same convention. Erythritol is recorded as a sugar alcohol.

## Keto, low-carb and high-protein labels
Computed per serving from ingredient quantities (`classifyServing`), never from ingredient names:

| Label | Rule per serving |
|---|---|
| Keto | ≤ 10 g net carbs **and** ≤ 12% of energy from net carbs |
| Low-carb | ≤ 20 g net carbs and ≤ 26% of energy from net carbs |
| High-protein | ≥ 15 g protein and ≥ 25% of energy from protein |

Keto **plans** additionally check every day's total against the user's net-carb limit and repair or flag days that exceed it.

## Daily plan validation
Each day is checked for: calories within ±15% of target (warning), below the safe floor (error),
protein < 85% of target, fibre < 60% of target, net carbs over the limit (error on keto), diet or
allergen violations (error), repeated dishes, and budget overrun.

## Safety screening (`safety.ts`)

| Condition | Effect |
|---|---|
| Under 13 | Not supported for planning; family recipes only |
| 13–17 | Maintenance, balanced only; professional referral |
| Pregnant / breastfeeding | Maintenance; keto, low-carb and high-protein blocked |
| Diabetes on insulin or tablets | Keto and low-carb blocked until reviewed with their doctor |
| Kidney disease | Keto and high-protein blocked; protein 0.8 g/kg |
| Liver, gallbladder, pancreatitis, heart disease, gout | Keto blocked |
| History of an eating disorder | No deficit; balanced only |
| BMI < 18.5 | No deficit |
| Target below BMI 18.5 | Target raised to BMI 18.5 with an explanation |

Blocked styles are disabled in onboarding with the reason; if a profile change makes the stored
style unsafe, targets fall back to balanced and say why.

## Data sources and status
- Ingredient values: IFCT 2017 (NIN), USDA FoodData Central (SR Legacy), typical Indian product labels,
  marked `reference_estimate` (or `unverified` for composite estimates) until checked against the source.
- Recipe nutrition: computed from those ingredients (`nutrition_status = estimated`), shown with
  "Estimated from ingredient quantities".
