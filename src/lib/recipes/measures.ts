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

type MeasureIngredient = Pick<Ingredient, "unitWeights" | "densityGPerMl"> & { category: string };

export function metricText(ing: MeasureIngredient, grams: number): string {
  if (ing.densityGPerMl) return `${roundGrams(grams / ing.densityGPerMl)} ml`;
  return `${roundGrams(grams)} g`;
}

const PIECE_FIRST = new Set(["vegetables", "fruits", "eggs"]);

function pluralWord(w: string) {
  if (/leaf$/.test(w)) return w.replace(/leaf$/, "leaves");
  if (/(s|sh|ch|x)$/.test(w)) return w + "es";
  return w + "s";
}

/** "1 medium onion" / "2 medium onions" / "2 lemons (juiced)". Fractions ≤ 1 stay singular. */
export function pluralLabel(n: number, label: string) {
  if (n <= 1) return label;
  const paren = label.indexOf(" (");
  if (paren > 0) {
    const head = label.slice(0, paren).split(" ");
    head[head.length - 1] = pluralWord(head[head.length - 1]);
    return head.join(" ") + label.slice(paren);
  }
  const words = label.split(" ");
  words[words.length - 1] = pluralWord(words[words.length - 1]);
  return words.join(" ");
}

/** Familiar Indian kitchen measure (cups/spoons/pieces), or null if none fits. */
export function kitchenText(ing: MeasureIngredient, grams: number): string | null {
  const u = ing.unitWeights;
  const pl = (_n: string, label: string, count: number) => pluralLabel(count, label);
  if (u.piece && (PIECE_FIRST.has(ing.category) || !u.tsp) && grams >= u.piece * 0.25 && grams / u.piece <= 12) {
    const n = friendlyNumber(grams / u.piece);
    return `${n} ${pl(n, u.pieceLabel ?? "piece", grams / u.piece)}`;
  }
  if (u.cup && grams >= u.cup * 0.25) return `${friendlyNumber(grams / u.cup)} cup`;
  if (u.tbsp && grams >= u.tbsp * 0.75) return `${friendlyNumber(grams / u.tbsp)} tbsp`;
  if (u.tsp) {
    if (grams < u.tsp * 0.125) return "a pinch";
    return `${friendlyNumber(grams / u.tsp)} tsp`;
  }
  if (u.piece && grams >= u.piece * 0.25 && grams / u.piece <= 12) {
    const n = friendlyNumber(grams / u.piece);
    return `${n} ${pl(n, u.pieceLabel ?? "piece", grams / u.piece)}`;
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
