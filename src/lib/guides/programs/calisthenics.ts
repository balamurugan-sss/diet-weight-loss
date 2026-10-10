import type { Guide, ProgramTemplate, TemplateDay } from "../types";
import { r, recovery, rest, t, weekGrid, workout } from "./helpers";
import { SRC } from "./sources";

const WARMUP = [t("march_in_place", 1, 60, 0), t("arm_circles", 1, 30, 0), t("cat_cow", 1, 40, 0)];
const COOLDOWN = [t("chest_stretch", 1, 30, 0), t("hamstring_stretch", 1, 40, 0), t("childs_pose", 1, 40, 0)];

/** Push-up ladder: incline → knee → full. */
const PUSH: [string, [number, number]][] = [
  ["incline_pushup", [8, 10]],
  ["knee_pushup", [6, 10]],
  ["knee_pushup", [10, 12]],
  ["pushup", [5, 8]],
];
const LEGS: [string, [number, number]][] = [
  ["bodyweight_squat", [10, 12]],
  ["bodyweight_squat", [12, 15]],
  ["reverse_lunge", [8, 10]],
  ["bulgarian_split_squat", [6, 8]],
];
const BRIDGE: [string, [number, number]][] = [
  ["glute_bridge", [12, 15]],
  ["glute_bridge", [15, 20]],
  ["single_leg_glute_bridge", [8, 10]],
  ["single_leg_glute_bridge", [10, 12]],
];
const SETS = [2, 3, 3, 3];
const PLANK = [20, 30, 35, 45];

function week(w: number): TemplateDay[] {
  const s = SETS[w];
  const [pushId, pushReps] = PUSH[w];
  const [legId, legReps] = LEGS[w];
  const [bridgeId, bridgeReps] = BRIDGE[w];

  const pushLegs = workout(
    `Push & legs (week ${w + 1})`,
    WARMUP,
    [
      r(pushId, s, pushReps, 60),
      r(legId, s, legReps, 60),
      ...(w >= 2 ? [r("pike_pushup", 2, [5, 8], 60)] : []),
      r("calf_raise", 2, [12, 15], 30),
      t("plank", s, PLANK[w], 30),
    ],
    COOLDOWN,
  );

  const backCore = workout(
    `Back, hips & core (week ${w + 1})`,
    WARMUP,
    [
      t("superman", s, [20, 25, 30, 30][w], 30),
      r("prone_ytw", 2, w < 2 ? [6, 8] : [8, 10], 30),
      r(bridgeId, s, bridgeReps, 45),
      r("dead_bug", s, w < 2 ? [6, 8] : [8, 10], 30),
      t("side_plank", 2, [15, 20, 25, 30][w], 20),
      t("wall_sit", 2, [20, 30, 40, 45][w], 45),
    ],
    COOLDOWN,
  );

  const circuit = workout(
    `Full-body circuit (week ${w + 1})`,
    WARMUP,
    [
      r(pushId, s, pushReps, 45),
      r("step_up", s, w < 2 ? [8, 10] : [10, 12], 45),
      r("bench_dip", 2, w < 2 ? [6, 8] : [8, 12], 45),
      t("bear_crawl", s, [20, 25, 30, 35][w], 30),
      t("mountain_climbers", s, [20, 25, 30, 30][w], 30),
      t("plank_shoulder_tap", 2, [20, 25, 30, 40][w], 30),
    ],
    COOLDOWN,
  );

  const mobility = recovery(
    "Mobility",
    [t("march_in_place", 1, 60, 0)],
    [t("mobility_flow", 1, 300, 0), t("worlds_greatest_stretch", 2, 30, 15), t("hip_circles", 1, 45, 0), t("cat_cow", 1, 60, 0)],
    [t("childs_pose", 1, 60, 0)],
  );

  return [pushLegs, rest(), backCore, mobility, circuit, rest(), rest()];
}

export const calisthenicsProgram: ProgramTemplate = {
  id: "calisthenics-4wk",
  guideSlug: "calisthenics-guide",
  name: "Calisthenics: 4-week bodyweight plan",
  level: "beginner",
  equipment: ["chair"],
  days: [0, 1, 2, 3].flatMap(week),
};

export const calisthenicsGuide: Guide = {
  slug: "calisthenics-guide",
  title: "Calisthenics Guide",
  category: "program",
  summary:
    "A 4-week bodyweight plan that builds strength, stamina and mobility with nothing but the floor and a sturdy chair. Push-ups progress from the wall to the floor.",
  tags: ["BODYWEIGHT", "BEGINNER", "HOME"],
  readMinutes: 7,
  pattern: "pushup",
  programId: "calisthenics-4wk",
  caution:
    "Check with your doctor first if you have heart disease, high blood pressure that isn't controlled, a recent injury or surgery, joint pain that gets worse with exercise, or if you are pregnant.",
  sections: [
    {
      heading: "Who it's for",
      blocks: [
        {
          kind: "p",
          text: "Calisthenics means training with your own body weight. This plan is for beginners and returners who want a clear, step-by-step routine they can do in a bedroom, on a terrace or in a park, without buying anything.",
        },
        {
          kind: "list",
          items: [
            "You can walk for 20 minutes and get up and down from the floor.",
            "You have 15–30 minutes, three or four days a week.",
            "You have a sturdy chair or a stair step, and a mat or folded dhurrie for floor work.",
          ],
        },
      ],
    },
    {
      heading: "What you'll gain",
      blocks: [
        {
          kind: "p",
          text: "Bodyweight work counts as muscle-strengthening activity, which the WHO recommends for all adults on two or more days a week, alongside 150–300 minutes of moderate activity such as brisk walking.",
        },
        {
          kind: "p",
          text: "Making the exercise harder step by step is what drives progress. In a small 2018 trial in young men, four weeks of harder and harder push-up variations improved bench-press strength about as well as training on the bench press itself.",
        },
        {
          kind: "list",
          items: [
            "More strength in everyday moves: getting up from the floor, carrying bags, climbing stairs.",
            "Better muscular endurance and a stronger, more stable trunk.",
            "Hips, shoulders and spine that move more freely, thanks to the warm-ups and the weekly mobility day.",
          ],
        },
        { kind: "tip", text: "Four weeks is a starting block, not a finish line. Expect clear strength gains; changes in body shape take longer and depend mostly on food and sleep." },
      ],
    },
    {
      heading: "How to do the key movements",
      blocks: [
        { kind: "h", text: "The push-up ladder" },
        {
          kind: "list",
          ordered: true,
          items: [
            "Incline push-up: hands on a kitchen counter or sturdy table, body in one straight line, lower the chest to the edge.",
            "Knee push-up: hands on the floor, knees down, a straight line from knees to head.",
            "Full push-up: on hands and toes, elbows at about 45° from the body, chest close to the floor.",
          ],
        },
        { kind: "h", text: "The squat ladder" },
        {
          kind: "list",
          ordered: true,
          items: [
            "Bodyweight squat: feet shoulder-width, sit the hips back and down, knees following the toes.",
            "Reverse lunge: step one foot back and lower until both knees are bent, then push back up.",
            "Split squat on a chair: rear foot resting on the chair seat, lower straight down on the front leg.",
          ],
        },
        { kind: "h", text: "Core basics" },
        {
          kind: "p",
          text: "Planks, side planks and dead bugs teach your trunk to stay still while the arms and legs work. Keep breathing; if your lower back sags or arches, stop the set.",
        },
      ],
    },
    {
      heading: "Your weekly schedule",
      blocks: [
        { kind: "p", text: "Three main sessions plus a short mobility day. Start on any day you like; just keep the order and the rest days." },
        weekGrid(calisthenicsProgram.days),
        {
          kind: "table",
          head: ["Week", "Push-up", "Legs", "Plank"],
          rows: [
            ["1", "Incline, 2 × 8–10", "Squat, 2 × 10–12", "20 s"],
            ["2", "Knee, 3 × 6–10", "Squat, 3 × 12–15", "30 s"],
            ["3", "Knee, 3 × 10–12", "Reverse lunge, 3 × 8–10 each leg", "35 s"],
            ["4", "Full, 3 × 5–8", "Chair split squat, 3 × 6–8 each leg", "45 s"],
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
            "Move up a step only when you can do the top of the rep range on every set with good form.",
            "If the new step is too hard, do one set of the new version and the rest with the old one. That still counts.",
            "Leave one or two good reps in reserve at the end of each set rather than grinding to failure.",
            "After week 4, repeat week 4 and add one rep per set each week, or slow the lowering to 3 seconds.",
          ],
        },
      ],
    },
    {
      heading: "Stay safe",
      blocks: [
        { kind: "caution", text: "Stop and rest if you feel chest pain, unusual breathlessness, dizziness or sharp joint pain. Seek medical help if chest pain doesn't settle quickly." },
        { kind: "caution", text: "Push-ups load the wrists. If they ache, make fists or use push-up handles, and stay on the incline version longer." },
        {
          kind: "list",
          items: [
            "In hot weather, train early in the morning or after sunset, keep water nearby and stop if you feel faint.",
            "Use a chair without wheels, pushed against a wall, for step-ups, dips and split squats.",
            "Mild muscle soreness for a day or two is normal in week 1; pain in a joint is not.",
          ],
        },
      ],
    },
    {
      heading: "Printable tracker",
      blocks: [
        { kind: "p", text: "Write down your best set each week. Seeing the numbers climb is the best motivation there is." },
        { kind: "log", head: ["Date", "Session", "Push-up type & reps", "Leg move & reps", "Plank (s)", "Notes"], rows: 12 },
      ],
    },
  ],
  sources: [SRC.whoActivity, SRC.whoGuidelines, SRC.pushupTrial, SRC.acsmProgression],
};
