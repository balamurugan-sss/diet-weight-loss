import type { Ingredient, RecipeLine } from "./types";

export type UnitSystem = "metric" | "kitchen";

const FRACTIONS: [number, string][] = [
  [0, ""],
  [0.25, "¼"],
  [1 / 3, "⅓"],
  [0.5, "½"],
  [2 / 3, "⅔"],
  [0.75, "¾"],
  [1, ""],
];

/** 1.5 → "1½", 0.25 → "¼", 2 → "2". Rounds to the nearest friendly fraction. */
export function friendlyNumber(x: number): string {
  if (x <= 0) return "0";
  const whole = Math.floor(x);
  const frac = x - whole;
  let best = FRACTIONS[0];
  for (const f of FRACTIONS) if (Math.abs(f[0] - frac) < Math.abs(best[0] - frac)) best = f;
  const w = best[0] === 1 ? whole + 1 : whole;
  const sym = best[0] === 1 ? "" : best[1];
  if (w === 0) return sym || "¼";
  return `${w}${sym}`;
}

export function roundGrams(g: number): number {
  if (g < 5) return Math.round(g * 2) / 2;
  if (g < 50) return Math.round(g);
  if (g < 200) return Math.round(g / 5) * 5;
  return Math.round(g / 10) * 10;
}

type MeasureIngredient = Pick<Ingredient, "unitWeights" | "densityGPerMl" | "category">;

export function metricText(ing: MeasureIngredient, grams: number): string {
  if (ing.densityGPerMl) return `${roundGrams(grams / ing.densityGPerMl)} ml`;
  return `${roundGrams(grams)} g`;
}

const PIECE_FIRST = new Set(["vegetables", "fruits", "eggs"]);

/** Familiar Indian kitchen measure (cups/spoons/pieces), or null if none fits. */
export function kitchenText(ing: MeasureIngredient, grams: number): string | null {
  const u = ing.unitWeights;
  const pl = (n: string, label: string) => {
    const one = n === "1" || n === "½" || n === "¼" || n === "⅓" || n === "¾" || n === "⅔";
    if (one) return label;
    if (/(leaf)$/.test(label)) return label.replace(/leaf$/, "leaves");
    if (/(sh|ch|s|x)$/.test(label)) return label + "es";
    if (/ \(/.test(label)) return label.replace(/^(\S+)/, "$1s");
    return label + "s";
  };
  if (u.piece && (PIECE_FIRST.has(ing.category) || !u.tsp) && grams >= u.piece * 0.25) {
    const n = friendlyNumber(grams / u.piece);
    return `${n} ${pl(n, u.pieceLabel ?? "piece")}`;
  }
  if (u.cup && grams >= u.cup * 0.25) return `${friendlyNumber(grams / u.cup)} cup`;
  if (u.tbsp && grams >= u.tbsp * 0.75) return `${friendlyNumber(grams / u.tbsp)} tbsp`;
  if (u.tsp) {
    if (grams < u.tsp * 0.125) return "a pinch";
    return `${friendlyNumber(grams / u.tsp)} tsp`;
  }
  if (u.piece && grams >= u.piece * 0.25) {
    const n = friendlyNumber(grams / u.piece);
    return `${n} ${pl(n, u.pieceLabel ?? "piece")}`;
  }
  return null;
}

export type DisplayQuantity = { primary: string; secondary: string | null };

export function displayQuantity(
  ing: MeasureIngredient,
  line: Pick<RecipeLine, "grams" | "measureText">,
  factor: number,
  system: UnitSystem,
): DisplayQuantity {
  const grams = line.grams * factor;
  const metric = metricText(ing, grams);
  // An authored measure is only trustworthy at the original quantity.
  const kitchen = factor === 1 && line.measureText ? line.measureText : kitchenText(ing, grams);
  if (system === "kitchen" && kitchen) return { primary: kitchen, secondary: metric };
  return { primary: metric, secondary: kitchen };
}

export function scaleFactor(fromServings: number, toServings: number) {
  return toServings / fromServings;
}
