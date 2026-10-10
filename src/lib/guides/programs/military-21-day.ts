import type { Guide, ProgramTemplate, TemplateDay } from "../types";
import { dayTable, r, recovery, rest, sessionChecklist, t, workout } from "./helpers";
import { SRC } from "./sources";

const WARMUP = [t("march_in_place", 1, 60, 0), t("standing_windmill", 1, 40, 0), r("inchworm", 1, [4, 6], 0)];
const COOLDOWN = [t("quad_stretch", 1, 30, 0), t("hamstring_stretch", 1, 40, 0), t("chest_stretch", 1, 30, 0)];

const PUSH_REPS: [number, number][] = [[6, 10], [8, 12], [10, 15]];
const SITUP_REPS: [number, number][] = [[10, 12], [12, 15], [15, 20]];
const THRUST_REPS: [number, number][] = [[6, 8], [8, 10], [10, 12]];

function week(w: number): TemplateDay[] {
  const strength = workout(
    `Strength circuit ${w + 1}`,
    WARMUP,
    [
      r("pushup", 3, PUSH_REPS[w], 60),
      r("bodyweight_squat", [3, 3, 4][w], w === 0 ? [12, 15] : [15, 20], 45),
      r("reverse_lunge", 3, w === 0 ? [8, 10] : [10, 12], 45),
      r("sit_up", 3, SITUP_REPS[w], 45),
      t("plank", 3, [30, 40, 45][w], 30),
    ],
    COOLDOWN,
  );

  const runShort = workout(
    `Run–walk intervals ${w + 1}`,
    [t("march_in_place", 1, 120, 0), t("standing_windmill", 1, 40, 0)],
    [
      t("run_intervals", [6, 7, 8][w], 60, 60),
      t("flutter_kicks", 3, [20, 25, 30][w], 30),
      t("side_plank", 2, [20, 25, 30][w], 20),
    ],
    [t("quad_stretch", 1, 30, 0), t("hamstring_stretch", 1, 40, 0)],
  );

  const ladder = workout(
    `Push-up & squat ladder ${w + 1}`,
    WARMUP,
    [
      r("pushup", [4, 5, 6][w], [2, 8], 30),
      r("bodyweight_squat", [4, 5, 6][w], [4, 12], 30),
      t("mountain_climbers", 3, [20, 30, 30][w], 30),
      t("plank_shoulder_tap", 2, [20, 30, 40][w], 30),
    ],
    COOLDOWN,
  );

  const walk = recovery(
    "Walk & stretch",
    [t("march_in_place", 1, 60, 0)],
    [t("brisk_walk", 1, [900, 1200, 1200][w], 0), t("mobility_flow", 1, 300, 0)],
    [t("childs_pose", 1, 60, 0)],
  );

  const conditioning = workout(
    `Conditioning rounds ${w + 1}`,
    WARMUP,
    [
      r("squat_thrust", [3, 3, 4][w], THRUST_REPS[w], 30),
      t("bear_crawl", 3, [20, 30, 30][w], 30),
      t("high_knees", 3, [20, 25, 30][w], 30),
      r("sit_up", 3, [10, 15], 30),
      t("mountain_climbers", 2, 30, 30),
    ],
    COOLDOWN,
  );

  const runLong = workout(
    `Longer intervals ${w + 1}`,
    [t("march_in_place", 1, 120, 0), t("standing_windmill", 1, 40, 0)],
    [
      t("run_intervals", [6, 7, 8][w], [90, 90, 120][w], 60),
      r("pushup", 2, [8, 12], 45),
      t("plank", 2, [30, 40, 45][w], 30),
    ],
    [t("quad_stretch", 1, 30, 0), t("hamstring_stretch", 1, 40, 0)],
  );

  const finalDay = workout(
    "Day 21 challenge",
    WARMUP,
    [
      r("pushup", 4, [10, 15], 60),
      r("bodyweight_squat", 4, [15, 20], 45),
      r("burpee", 3, [8, 10], 45),
      r("sit_up", 3, [15, 20], 45),
      t("bear_crawl", 3, 30, 30),
      t("plank", 3, 45, 30),
    ],
    COOLDOWN,
  );

  if (w < 2) return [strength, runShort, ladder, walk, conditioning, runLong, rest()];
  return [strength, runShort, ladder, walk, conditioning, rest(), finalDay];
}

export const military21Program: ProgramTemplate = {
  id: "military-21-day",
  guideSlug: "21-day-military-calisthenics",
  name: "21-day military calisthenics",
  level: "intermediate",
  equipment: ["none"],
  days: [0, 1, 2].flatMap(week),
};

export const military21Guide: Guide = {
  slug: "21-day-military-calisthenics",
  title: "21-Day Military Calisthenics Plan",
  category: "program",
  summary:
    "Three weeks of drill-style conditioning: push-ups, squats, lunges, core work, ladders and run–walk intervals, with a recovery day and a rest day built into every week.",
  tags: ["BODYWEIGHT", "INTERMEDIATE", "21 DAYS"],
  readMinutes: 7,
  pattern: "burpee",
  programId: "military-21-day",
  caution:
    "This plan is vigorous. Check with your doctor first if you have heart disease, diabetes, high blood pressure, are over 45 and not used to hard exercise, are pregnant, or have knee, hip, back or ankle problems.",
  sections: [
    {
      heading: "Who it's for",
      blocks: [
        {
          kind: "p",
          text: "This plan borrows the structure of army physical readiness training: a proper warm-up, short hard blocks of bodyweight work, running, and planned recovery. It is not an official military programme and no fitness test is required.",
        },
        {
          kind: "list",
          items: [
            "You already exercise a couple of times a week and can do about 5 push-ups (from the knees is fine to start).",
            "You can jog gently for a minute, or walk briskly if running isn't for you.",
            "You have 20–35 minutes on most days for three weeks.",
          ],
        },
        { kind: "tip", text: "New to exercise? Do the Basic Workouts Guide or the Calisthenics Guide first, then come back to this one." },
      ],
    },
    {
      heading: "What you'll gain",
      blocks: [
        {
          kind: "p",
          text: "The US Army's own fitness doctrine (FM 7-22) stresses starting with preparation drills, building up gradually and treating recovery as part of training. We follow the same ideas on a civilian scale.",
        },
        {
          kind: "list",
          items: [
            "More push-ups, squats and sit-ups than on day 1: most people see clear gains in three weeks when they train consistently.",
            "Better stamina from intervals, which count towards the WHO's 75–150 minutes of vigorous activity a week.",
            "A habit: 18 training days in 21 is a solid routine to keep going with.",
          ],
        },
        { kind: "tip", text: "No plan can promise a set amount of weight loss. What changes the scale is mostly food; what this plan reliably changes is fitness." },
      ],
    },
    {
      heading: "How to do the key drills",
      blocks: [
        { kind: "h", text: "Ladders" },
        {
          kind: "p",
          text: "On ladder days, climb the reps: 2 push-ups, rest, 4, rest, 6, rest, 8. Then repeat or climb down. Do squats the same way, in steps of 4. Stop a rung early if your form slips.",
        },
        { kind: "h", text: "Conditioning rounds" },
        {
          kind: "p",
          text: "Work steadily through each move with short rests. Aim for smooth, controlled reps at a pace you could keep up for the whole session. This is not a race.",
        },
        { kind: "h", text: "Run–walk intervals" },
        {
          kind: "p",
          text: "Jog for the set time, then walk briskly during the rest. Use a flat park path, a building terrace or a school ground. No space? Jog on the spot. Bad knees? Walk fast instead.",
        },
        { kind: "h", text: "Easier and harder options" },
        {
          kind: "table",
          head: ["Drill", "Easier", "Harder"],
          rows: [
            ["Push-up", "Knee or incline push-up", "Feet on a step"],
            ["Squat thrust", "Step the feet back one at a time", "Add a jump at the top (burpee)"],
            ["High knees", "Fast march in place", "Speed up the last 10 seconds"],
            ["Sit-up", "Reverse crunch or dead bug", "Arms crossed, slower lowering"],
            ["Run interval", "Brisk walk", "Add 15 seconds per interval"],
          ],
        },
      ],
    },
    {
      heading: "Your 21-day schedule",
      blocks: [
        { kind: "p", text: "Each week has five or six training days, a walk-and-stretch recovery day and a full rest day. Day 21 is a final challenge to finish strong." },
        dayTable(military21Program.days),
      ],
    },
    {
      heading: "How to progress",
      blocks: [
        {
          kind: "list",
          items: [
            "The plan already adds sets, reps and interval time each week. Your job is to keep the form clean.",
            "If you finish the top of every rep range with good form, use the harder option next time.",
            "If you can't hit the bottom of the range, use the easier option. It's still the same plan.",
            "Missed a day? Carry on from where you are. Don't double up sessions to catch up.",
          ],
        },
      ],
    },
    {
      heading: "Stay safe",
      blocks: [
        { kind: "caution", text: "Stop at once if you feel chest pain or tightness, faintness, dizziness or an irregular heartbeat. Seek medical help if it doesn't settle quickly." },
        { kind: "caution", text: "Burpees, high knees and running are high-impact. If you have knee, ankle or back problems, or a lot of weight to lose, use the step-back and marching versions." },
        {
          kind: "list",
          items: [
            "Indian summers are hot: train at sunrise or after sunset, drink water before and after, and skip the run if there's a heat-wave warning.",
            "Wear supportive shoes for running; train barefoot only on a non-slip surface.",
            "Sharp or one-sided joint pain means stop, not push through.",
            "Sleep counts: an extra rest day is better than training through exhaustion.",
          ],
        },
      ],
    },
    {
      heading: "Printable tracker",
      blocks: [
        { kind: "p", text: "Tick each day off. On days 1 and 21, write down your best push-up set and plank time to see how far you've come." },
        sessionChecklist(military21Program.days),
        { kind: "log", head: ["Day", "Best push-up set", "Squats in a set", "Plank (s)", "How I felt (1–5)"], rows: 2 },
      ],
    },
  ],
  sources: [SRC.armyFm722, SRC.armyH2f, SRC.whoActivity, SRC.whoGuidelines],
};
