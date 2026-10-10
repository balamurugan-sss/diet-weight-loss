/**
 * Image prompts for finished dishes and cooking steps. Prompts are built only
 * from validated recipe data, and track which ingredients have entered the
 * scene so successive step images stay visually continuous.
 */

export const IMAGE_STYLE =
  "Realistic Indian home-kitchen food photography. 45-degree overhead angle, soft natural window light from the left, " +
  "warm ivory and light-wood surfaces, stainless steel and cast-iron cookware, shallow depth of field, true-to-life colours " +
  "and textures. No text, no labels, no watermarks, no people's faces. Hands may appear only when the step requires them.";

const VESSELS = [
  "pressure cooker",
  "clay pot",
  "manchatti",
  "air-fryer basket",
  "air fryer",
  "iron kadai",
  "kadai",
  "tawa",
  "non-stick pan",
  "frying pan",
  "pan",
  "saucepan",
  "pot",
  "idli stand",
  "steamer",
  "baking tray",
  "mixer jar",
  "mixing bowl",
  "bowl",
];

export type PromptStep = { stepIndex: number; title: string; kind: string; uses: string[]; visual: string; tempC: number | null; timerSec: number | null };
export type PromptRecipe = { title: string; cuisine: string; description: string; steps: PromptStep[] };

function primaryVessel(steps: PromptStep[]) {
  for (const s of steps.filter((s) => s.kind === "cook")) {
    const v = VESSELS.find((v) => s.visual.toLowerCase().includes(v));
    if (v) return v;
  }
  return null;
}

/** Ingredient ids visible by the end of `stepIndex`, and those not yet added. */
export function sceneState(steps: PromptStep[], stepIndex: number, allIds: string[]) {
  const introduced = new Set<string>();
  for (const s of steps) if (s.stepIndex <= stepIndex) s.uses.forEach((u) => introduced.add(u));
  const future = allIds.filter((id) => !introduced.has(id) && id !== "water" && id !== "salt");
  return { introduced: [...introduced], future };
}

export function heroPrompt(r: PromptRecipe, names: (id: string) => string) {
  const last = r.steps[r.steps.length - 1];
  return [
    IMAGE_STYLE,
    `The finished dish: ${r.title} (${r.cuisine.replace("_", " ")} cuisine). ${r.description}`,
    `Presentation: ${last.visual}.`,
    `Show one realistic home-style portion with accurate ingredients — ${[...new Set(r.steps.flatMap((s) => s.uses))].slice(0, 10).map(names).join(", ")}.`,
  ].join("\n");
}

export function stepPrompt(r: PromptRecipe, stepIndex: number, allIds: string[], names: (id: string) => string, hasReference: boolean) {
  const step = r.steps[stepIndex];
  const last = stepIndex === r.steps.length - 1;
  const { introduced, future } = sceneState(r.steps, stepIndex, allIds);
  const vessel = primaryVessel(r.steps);
  const lines = [
    IMAGE_STYLE,
    `Cooking ${r.title}, step ${stepIndex + 1} of ${r.steps.length}: ${step.title}.`,
    `The photo shows: ${step.visual}.`,
  ];
  if (introduced.length) lines.push(`Ingredients that may be visible at this stage: ${introduced.map(names).join(", ")}.`);
  if (future.length && !last) lines.push(`Do NOT show these yet — they are added later: ${future.map(names).join(", ")}.`);
  if (vessel && step.kind === "cook") lines.push(`Use the same ${vessel} as in the other cooking steps.`);
  if (step.tempC) lines.push(`Cooking at ${step.tempC}°C.`);
  if (!last) lines.push("The dish is still in progress — do not show the finished, plated dish.");
  if (hasReference) lines.push("Keep the same countertop, cookware, lighting and camera angle as the reference image from the previous step; quantities must stay consistent.");
  return lines.join("\n");
}
