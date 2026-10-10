import type { Guide, ProgramTemplate, TemplateDay } from "../types";
import { r, recovery, rest, t, weekGrid, workout } from "./helpers";
import { SRC } from "./sources";

const WARMUP = [t("march_in_place", 1, 90, 0), t("arm_circles", 1, 30, 0), t("hip_circles", 1, 30, 0)];
const COOLDOWN = [t("quad_stretch", 1, 30, 0), t("hamstring_stretch", 1, 40, 0), t("chest_stretch", 1, 30, 0)];

const SETS = [2, 2, 3, 3];

function week(w: number): TemplateDay[] {
  const s = SETS[w];
  const squat = w < 2 ? "chair_squat" : "bodyweight_squat";
  const lift = (lo: number) => [lo + (w % 2) * 2, lo + 2 + (w % 2) * 2] as [number, number];

  const a = workout(
    `Full body A (week ${w + 1})`,
    WARMUP,
    [
      r(squat, s, lift(8), 60),
      r("incline_pushup", s, lift(6), 60),
      r("glute_bridge", s, lift(10), 45),
      t("superman", s, [15, 20, 20, 25][w], 30),
      t("plank", 2, [15, 20, 25, 30][w], 30),
    ],
    COOLDOWN,
  );

  const b = workout(
    `Full body B (week ${w + 1})`,
    WARMUP,
    [
      r(w < 2 ? "step_up" : "reverse_lunge", s, lift(6), 60),
      r("incline_pushup", s, lift(6), 60),
      r("dead_bug", s, lift(5), 30),
      r("calf_raise", 2, lift(10), 30),
      t("side_plank", 2, [10, 15, 15, 20][w], 20),
    ],
    COOLDOWN,
  );

  const c = workout(
    `Full body C (week ${w + 1})`,
    WARMUP,
    [
      t("brisk_walk", 1, [300, 420, 480, 600][w], 0),
      r(squat, s, lift(8), 60),
      r(w < 3 ? "incline_pushup" : "knee_pushup", s, w < 3 ? lift(6) : [5, 8], 60),
      r("glute_bridge", s, lift(10), 45),
      t("mountain_climbers", 2, [15, 20, 20, 25][w], 30),
    ],
    COOLDOWN,
  );

  const walk = recovery("Easy walk (optional)", [t("march_in_place", 1, 60, 0)], [t("brisk_walk", 1, [900, 1200, 1200, 1500][w], 0)], [t("hamstring_stretch", 1, 40, 0)]);

  return [a, rest(), b, rest(), c, walk, rest()];
}

export const basicWorkoutsProgram: ProgramTemplate = {
  id: "basic-workouts-4wk",
  guideSlug: "basic-workouts",
  name: "Basic workouts: 4 weeks",
  level: "beginner",
  equipment: ["chair"],
  days: [0, 1, 2, 3].flatMap(week),
};

export const basicWorkoutsGuide: Guide = {
  slug: "basic-workouts",
  title: "Basic Workouts Guide",
  category: "program",
  summary:
    "Three short full-body sessions a week for four weeks. Learn the fundamental movements with good form, then build up slowly. Ideal if you are starting from zero.",
  tags: ["BEGINNER", "FULL BODY", "HOME"],
  readMinutes: 6,
  pattern: "squat",
  programId: "basic-workouts-4wk",
  caution:
    "If you have a heart condition, high blood pressure, diabetes, joint problems, are pregnant or recovering from surgery or illness, check with your doctor before starting.",
  sections: [
    {
      heading: "Who it's for",
      blocks: [
        {
          kind: "p",
          text: "This is the place to start if you've never followed a workout plan, or haven't exercised in a long time. Every session uses the same handful of basic moves so you can learn them properly, and nothing needs more than a chair and a little floor space.",
        },
        {
          kind: "list",
          items: [
            "15–30 minutes, three days a week.",
            "A sturdy chair without wheels, a wall and a mat or folded bedsheet.",
            "Comfortable clothes and shoes, or bare feet on a non-slip floor.",
          ],
        },
      ],
    },
    {
      heading: "What you'll gain",
      blocks: [
        {
          kind: "p",
          text: "The WHO recommends muscle-strengthening activity on two or more days a week for all adults. For beginners, the American College of Sports Medicine suggests training the whole body two to three days a week and progressing gradually. This plan does exactly that.",
        },
        {
          kind: "list",
          items: [
            "Confidence with the basic patterns: squat, step, push, hinge and brace.",
            "Noticeable strength gains in the first few weeks, as your body learns to use its muscles better.",
            "A routine that fits into a normal week, which matters more than any single workout.",
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
            "Chair squat: sit back to touch the chair lightly, then stand. Knees follow the toes and the chest stays proud.",
            "Incline push-up: hands on a counter or table, body straight, lower the chest to the edge and press away.",
            "Glute bridge: lying on your back with knees bent, squeeze the buttocks and lift the hips into a straight line.",
            "Step-up: step onto a low stair with the whole foot, stand tall, step down with control.",
            "Superman: lying face down, lift the arms and legs a little and hold, looking at the floor.",
            "Plank and side plank: hold a straight line from head to heels (or knees). Keep breathing.",
          ],
        },
        { kind: "tip", text: "Slow is good. Take about two seconds to lower and one to rise. Good form at a slow pace builds strength faster than rushing." },
      ],
    },
    {
      heading: "Your weekly schedule",
      blocks: [
        { kind: "p", text: "Three workouts on non-consecutive days, an optional easy walk, and rest days for recovery. Rest days are when you actually get stronger." },
        weekGrid(basicWorkoutsProgram.days),
        {
          kind: "table",
          head: ["Week", "Sets", "What changes"],
          rows: [
            ["1", "2", "Learn the moves; stop each set with 2–3 reps still in the tank"],
            ["2", "2", "Two more reps per set"],
            ["3", "3", "Chair squat becomes a free squat; step-up becomes a reverse lunge"],
            ["4", "3", "Two more reps; try knee push-ups on Full body C"],
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
            "Follow the plan's rep ranges. If you hit the top of the range easily on every set, use the harder version next time.",
            "If the bottom of the range is a struggle, stay at the current week for another week. There's no rush.",
            "Track your sessions. Two missed weeks? Restart from week 1, or the last week that felt comfortable.",
            "After week 4, move on to the Calisthenics Guide.",
          ],
        },
      ],
    },
    {
      heading: "Stay safe",
      blocks: [
        { kind: "caution", text: "Stop if you feel chest pain, dizziness, unusual breathlessness or sharp pain. Seek medical help if chest pain doesn't ease with rest." },
        { kind: "caution", text: "Pregnant, especially after the first trimester? Skip moves done lying on your back (glute bridge, dead bug) and ask your doctor about alternatives." },
        {
          kind: "list",
          items: [
            "Push the chair against a wall so it can't slide.",
            "Train in a well-ventilated room or in the cooler part of the day, and sip water between exercises.",
            "Feeling a bit stiff the day after is normal. Pain in a joint is not, so ease off.",
          ],
        },
      ],
    },
    {
      heading: "Printable tracker",
      blocks: [
        {
          kind: "checklist",
          items: basicWorkoutsProgram.days.flatMap((d, i) => (d.kind === "workout" ? [`Week ${Math.floor(i / 7) + 1}: ${d.title.replace(/ \(week \d\)$/, "")}`] : [])),
        },
        { kind: "log", head: ["Date", "Squat reps", "Push-up reps", "Plank (s)", "How I felt (1–5)"], rows: 12 },
      ],
    },
  ],
  sources: [SRC.whoActivity, SRC.whoGuidelines, SRC.acsmProgression],
};
