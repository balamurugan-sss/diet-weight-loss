import type { Guide, ProgramTemplate, TemplateDay } from "../types";
import { r, recovery, rest, sessionChecklist, t, weekGrid, workout } from "./helpers";
import { SRC } from "./sources";

const WARMUP = [t("march_in_place", 1, 90, 0), t("standing_windmill", 1, 40, 0), t("worlds_greatest_stretch", 1, 30, 0)];
const COOLDOWN = [t("quad_stretch", 1, 30, 0), t("hamstring_stretch", 1, 40, 0), t("chest_stretch", 1, 30, 0)];

const SETS = [3, 3, 4, 4];
/** Strength reps: weeks 3–4 drop the reps so you can go heavier. */
const REPS: [number, number][] = [
  [10, 12],
  [10, 12],
  [8, 10],
  [8, 10],
];
const PUSH: [string, [number, number]][] = [
  ["pushup", [8, 12]],
  ["pushup", [10, 15]],
  ["decline_pushup", [6, 10]],
  ["decline_pushup", [8, 12]],
];

function week(w: number): TemplateDay[] {
  const s = SETS[w];
  const strengthA = workout(
    `Strength A (week ${w + 1})`,
    WARMUP,
    [
      r("goblet_squat", s, REPS[w], 75),
      r("dumbbell_row", s, REPS[w], 60),
      r(PUSH[w][0], s, PUSH[w][1], 60),
      r("dumbbell_rdl", s, REPS[w], 75),
      t("farmer_carry", 3, [40, 45, 50, 60][w], 45),
      t("plank", 2, [40, 45, 50, 60][w], 30),
    ],
    COOLDOWN,
  );

  const intervals = workout(
    `Intervals & drills (week ${w + 1})`,
    [t("march_in_place", 1, 120, 0), t("standing_windmill", 1, 40, 0)],
    [
      t("run_intervals", [6, 8, 6, 8][w], [60, 60, 90, 90][w], 60),
      r("squat_thrust", 3, w < 2 ? [8, 10] : [10, 12], 45),
      t("mountain_climbers", 3, [25, 30, 30, 35][w], 30),
    ],
    [t("quad_stretch", 1, 30, 0), t("hamstring_stretch", 1, 40, 0)],
  );

  const walk = recovery(
    "Walk & mobility",
    [t("march_in_place", 1, 60, 0)],
    [t("brisk_walk", 1, [1200, 1200, 1500, 1500][w], 0), t("mobility_flow", 1, 300, 0)],
    [t("childs_pose", 1, 60, 0)],
  );

  const strengthB = workout(
    `Strength B (week ${w + 1})`,
    WARMUP,
    [
      r("dumbbell_lunge", s, w < 2 ? [8, 10] : [10, 12], 60),
      r("dumbbell_shoulder_press", s, REPS[w], 60),
      r("dumbbell_row", s, REPS[w], 60),
      r("sit_up", 3, w < 2 ? [12, 15] : [15, 20], 45),
      t("side_plank", 2, [25, 30, 35, 40][w], 20),
    ],
    COOLDOWN,
  );

  const circuit = workout(
    `Conditioning circuit (week ${w + 1})`,
    WARMUP,
    [
      t("bear_crawl", 3, [25, 30, 35, 40][w], 30),
      r("squat_thrust", 3, [8, 12], 30),
      t("farmer_carry", 3, [40, 45, 50, 60][w], 30),
      r("pushup", 3, [8, 12], 30),
      t("flutter_kicks", 3, [20, 25, 30, 30][w], 30),
      t("high_knees", 3, [20, 25, 30, 30][w], 30),
    ],
    COOLDOWN,
  );

  return [strengthA, intervals, walk, strengthB, rest(), circuit, rest()];
}

export const militaryConditioningProgram: ProgramTemplate = {
  id: "military-conditioning-4wk",
  guideSlug: "military-conditioning",
  name: "Military conditioning: 4 weeks",
  level: "intermediate",
  equipment: ["dumbbells"],
  days: [0, 1, 2, 3].flatMap(week),
};

export const militaryConditioningGuide: Guide = {
  slug: "military-conditioning",
  title: "Military Conditioning Printable Guide",
  category: "program",
  summary:
    "A printable 4-week plan for functional strength and work capacity: two dumbbell strength days, intervals, a drill circuit and a recovery walk each week.",
  tags: ["CONDITIONING", "INTERMEDIATE", "DUMBBELLS", "PRINTABLE"],
  readMinutes: 7,
  pattern: "squat",
  programId: "military-conditioning-4wk",
  caution:
    "This is a demanding plan. Get medical advice first if you have heart disease, high blood pressure, diabetes, a hernia, back or joint problems, are pregnant, or have not exercised regularly in the past three months.",
  sections: [
    {
      heading: "Who it's for",
      blocks: [
        {
          kind: "p",
          text: "This plan is built for people who already train and want to be fit for real tasks: lifting, carrying, running and getting up and down from the ground. It takes the structure of army-style conditioning (strength, endurance and movement drills, with recovery planned in) and fits it to a home setting.",
        },
        {
          kind: "list",
          items: [
            "You can do 10 push-ups, 20 bodyweight squats and jog for 5 minutes.",
            "You have a pair of dumbbells, or something you can load safely (see below).",
            "You can train five days a week for 25–40 minutes.",
          ],
        },
        {
          kind: "tip",
          text: "No dumbbells? Use two backpacks loaded with books, or two filled 5-litre water cans for carries and squats. Keep the load even and the grip secure.",
        },
      ],
    },
    {
      heading: "What you'll gain",
      blocks: [
        {
          kind: "p",
          text: "The Army's FM 7-22 doctrine builds physical readiness from strength, endurance and mobility, starting slowly and working towards harder sessions, with recovery as part of the plan. The WHO recommends muscle-strengthening on two or more days a week plus regular aerobic activity; this plan covers both.",
        },
        {
          kind: "list",
          items: [
            "Stronger legs, back and shoulders for lifting and carrying.",
            "Better recovery between hard efforts, from interval running and circuits.",
            "A firmer, more stable trunk from carries, planks and crawling.",
          ],
        },
      ],
    },
    {
      heading: "How to do the key movements",
      blocks: [
        {
          kind: "list",
          items: [
            "Goblet squat: hold one dumbbell at the chest, sit down between the heels, elbows inside the knees.",
            "Romanian deadlift: soft knees, push the hips back and slide the weights down the thighs until you feel the hamstrings, then stand tall.",
            "Row: one hand on a chair, back flat, pull the dumbbell to the hip.",
            "Farmer's carry: heavy weights at your sides, walk tall with short steps. Your grip and trunk do the work.",
            "Squat thrust: hands down, feet back to a plank, feet back in, stand. Step instead of jumping to make it gentler.",
            "Bear crawl: knees hovering just off the floor, back flat, small opposite hand-and-foot steps.",
          ],
        },
        {
          kind: "p",
          text: "Pick a weight that leaves 2–3 reps in reserve at the end of each set. When every set reaches the top of the range with good form, go a little heavier next time.",
        },
      ],
    },
    {
      heading: "Your weekly schedule",
      blocks: [
        { kind: "p", text: "Four hard days, one recovery walk and two rest days. Strength and conditioning days alternate, and the recovery walk sits in the middle of the week." },
        weekGrid(militaryConditioningProgram.days),
        {
          kind: "table",
          head: ["Week", "Strength sets × reps", "Intervals", "Focus"],
          rows: [
            ["1", "3 × 10–12", "6 × 1 min", "Learn the moves, find your weights"],
            ["2", "3 × 10–12", "8 × 1 min", "Same weights, more reps and rounds"],
            ["3", "4 × 8–10", "6 × 90 s", "Heavier weights, decline push-ups"],
            ["4", "4 × 8–10", "8 × 90 s", "Hold the heavier weights, finish strong"],
          ],
        },
      ],
    },
    {
      heading: "How to progress",
      blocks: [
        {
          kind: "list",
          items: [
            "Strength: add load in small steps (about 1–2 kg per dumbbell) once you pass the top of the rep range.",
            "Conditioning: the plan adds time and rounds each week. Keep the same quality of movement as the work goes up.",
            "If you're still sore from the last session or sleeping badly, cut one set from each exercise that day.",
            "After week 4, take an easier week (half the sets) before starting a new block.",
          ],
        },
      ],
    },
    {
      heading: "Stay safe",
      blocks: [
        { kind: "caution", text: "Stop immediately if you have chest pain, unusual breathlessness, dizziness or palpitations. Get medical help if it doesn't settle quickly." },
        { kind: "caution", text: "Running, high knees and jumping squat thrusts are high-impact. With knee, hip or ankle problems, swap to brisk walking, marching and step-back squat thrusts." },
        {
          kind: "list",
          items: [
            "Lift with a flat back. If the back rounds, the weight is too heavy.",
            "Train outdoors only in the cooler hours, drink water through the day and stop if you have a headache or nausea in the heat.",
            "Keep at least one full rest day between the two hardest sessions.",
          ],
        },
      ],
    },
    {
      heading: "Printable tracker",
      blocks: [
        { kind: "p", text: "Print this page and tick each session off. Write your weights in the log so you know what to lift next time." },
        sessionChecklist(militaryConditioningProgram.days),
        { kind: "log", head: ["Date", "Exercise", "Weight (kg)", "Sets × reps", "Notes"], rows: 16 },
      ],
    },
  ],
  sources: [SRC.armyFm722, SRC.armyH2f, SRC.whoActivity, SRC.acsmProgression],
};
