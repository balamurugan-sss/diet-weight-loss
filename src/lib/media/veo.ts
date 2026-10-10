import type { Exercise } from "@/lib/workouts/types";

/**
 * Google Veo 3.1 (Gemini API) exercise demo clips. Generation is a
 * long-running operation: start → poll the operation → download the video.
 * Veo 3.1 always renders an audio track; the app plays clips muted.
 */
export const VEO = {
  base: "https://generativelanguage.googleapis.com/v1beta",
  defaultModel: "veo-3.1-fast-generate-preview",
  /** Clip length in seconds ("4" | "6" | "8"). Short clips loop like a GIF. */
  durationSeconds: "4",
  /** Rough list prices per second of 720p video (verify on Google's pricing page). */
  pricePerSecondUsd: { "veo-3.1-fast-generate-preview": 0.08, "veo-3.1-generate-preview": 0.2 } as Record<string, number>,
};

const EQUIPMENT_WORDS: Record<string, string> = {
  dumbbells: "dumbbells",
  bands: "a resistance band",
  pullup_bar: "a pull-up bar",
  bench: "a flat bench",
  barbell: "a barbell",
  machine: "the gym machine",
  cable: "a cable machine",
  kettlebell: "a kettlebell",
};

/**
 * One consistent look across the library: same athlete style, camera, floor
 * and lighting (dark studio, lime rim light), matching the app's design.
 */
export function exerciseVideoPrompt(ex: Exercise) {
  const gear = ex.equipment.length ? ` using ${ex.equipment.map((e) => EQUIPMENT_WORDS[e] ?? e).join(" and ")}` : " with no equipment";
  const place = ex.settings.includes("gym") && ex.equipment.some((e) => ["machine", "cable", "barbell"].includes(e)) ? "a minimal dark gym" : "a minimal dark home studio";
  const steps = ex.steps.slice(0, 4).join(" ");
  const motion = ex.mode === "time" ? "holding and moving steadily through the exercise" : "performing two slow, controlled repetitions";
  return [
    `Fitness demonstration video of one fit Indian adult in plain black athletic wear ${motion}: ${ex.name}${gear}.`,
    `Technique: ${steps}`,
    `Textbook form, anatomically correct joints, realistic body proportions, smooth natural movement.`,
    `Setting: ${place}, matte dark floor, soft neon-lime rim light, plain dark background.`,
    `Camera: static, three-quarter side view, whole body in frame from head to feet, eye level, no cuts.`,
    `The clip starts and ends in the same position so it loops seamlessly. No text, no logos, no music.`,
  ].join(" ");
}

export const NEGATIVE_PROMPT =
  "text, captions, logos, watermark, multiple people, extra limbs, distorted hands, warped body, unsafe form, rounded back under load, camera movement, zoom, scene cuts, mirrors";

export function startRequestBody(prompt: string) {
  return {
    instances: [{ prompt }],
    parameters: { aspectRatio: "16:9", resolution: "720p", durationSeconds: VEO.durationSeconds, negativePrompt: NEGATIVE_PROMPT },
  };
}

export type OperationState = { done: false } | { done: true; uri: string } | { done: true; error: string };

/** Reads a long-running operation: `{ done, response.generateVideoResponse.generatedSamples[0].video.uri }` or `{ error }`. */
export function parseOperation(body: unknown): OperationState {
  const op = body as {
    done?: boolean;
    error?: { message?: string };
    response?: { generateVideoResponse?: { generatedSamples?: { video?: { uri?: string } }[]; raiMediaFilteredReasons?: string[] } };
  };
  if (!op?.done) return { done: false };
  if (op.error) return { done: true, error: op.error.message ?? "generation_failed" };
  const resp = op.response?.generateVideoResponse;
  const uri = resp?.generatedSamples?.[0]?.video?.uri;
  if (uri) return { done: true, uri };
  return { done: true, error: resp?.raiMediaFilteredReasons?.[0] ?? "no_video" };
}

export function estimateCostUsd(model: string, clips = 1) {
  const perSec = VEO.pricePerSecondUsd[model] ?? 0.2;
  return Math.round(perSec * Number(VEO.durationSeconds) * clips * 100) / 100;
}
