import type { Guide, ProgramTemplate, TemplateDay } from "../types";
import { dayTable, recovery, sessionChecklist, t, workout } from "./helpers";
import { SRC } from "./sources";

const WARMUP = [t("tai_chi_breathing", 1, 60, 0), t("tai_chi_weight_shift", 1, 45, 0)];
const COOLDOWN = [t("tai_chi_closing", 1, 60, 0)];

/** Moves done one side at a time get a shorter hold per side. */
const SIDED = new Set(["tai_chi_brush_knee", "tai_chi_parting_mane", "tai_chi_bird_tail", "tai_chi_rooster_balance"]);

type Plan = { title: string; moves: string[] };

const WEEKS: Plan[][] = [
  [
    { title: "Opening and breath", moves: ["tai_chi_opening", "tai_chi_wave_hands", "tai_chi_walk_forward"] },
    { title: "Clouds", moves: ["tai_chi_opening", "tai_chi_wave_hands", "tai_chi_walk_sideways"] },
    { title: "Brush knee", moves: ["tai_chi_opening", "tai_chi_brush_knee", "tai_chi_wave_hands"] },
    { title: "Side steps", moves: ["tai_chi_walk_sideways", "tai_chi_wave_hands", "tai_chi_brush_knee"] },
    { title: "First balance", moves: ["tai_chi_opening", "tai_chi_rooster_balance", "tai_chi_wave_hands"] },
    { title: "Link it up", moves: ["tai_chi_opening", "tai_chi_wave_hands", "tai_chi_brush_knee"] },
  ],
  [
    { title: "Horse's mane", moves: ["tai_chi_opening", "tai_chi_wave_hands", "tai_chi_parting_mane", "tai_chi_walk_forward"] },
    { title: "Walking flow", moves: ["tai_chi_walk_forward", "tai_chi_walk_sideways", "tai_chi_wave_hands", "tai_chi_brush_knee"] },
    { title: "Balance two", moves: ["tai_chi_opening", "tai_chi_rooster_balance", "tai_chi_parting_mane", "tai_chi_wave_hands"] },
    { title: "Backward steps", moves: ["tai_chi_opening", "tai_chi_walk_backward", "tai_chi_brush_knee", "tai_chi_wave_hands"] },
    { title: "Mane and knee", moves: ["tai_chi_opening", "tai_chi_parting_mane", "tai_chi_brush_knee", "tai_chi_wave_hands"] },
    { title: "Link it up", moves: ["tai_chi_opening", "tai_chi_wave_hands", "tai_chi_brush_knee", "tai_chi_parting_mane"] },
  ],
  [
    { title: "Bird's tail", moves: ["tai_chi_opening", "tai_chi_wave_hands", "tai_chi_bird_tail", "tai_chi_rooster_balance", "tai_chi_walk_forward"] },
    { title: "Walking flow", moves: ["tai_chi_walk_forward", "tai_chi_walk_backward", "tai_chi_walk_sideways", "tai_chi_wave_hands", "tai_chi_brush_knee"] },
    { title: "Balance three", moves: ["tai_chi_opening", "tai_chi_rooster_balance", "tai_chi_parting_mane", "tai_chi_bird_tail", "tai_chi_wave_hands"] },
    { title: "Push and flow", moves: ["tai_chi_opening", "tai_chi_brush_knee", "tai_chi_bird_tail", "tai_chi_wave_hands", "tai_chi_walk_sideways"] },
    { title: "Mane and tail", moves: ["tai_chi_opening", "tai_chi_parting_mane", "tai_chi_bird_tail", "tai_chi_wave_hands", "tai_chi_brush_knee"] },
    {
      title: "Full flow",
      moves: ["tai_chi_opening", "tai_chi_wave_hands", "tai_chi_brush_knee", "tai_chi_parting_mane", "tai_chi_rooster_balance", "tai_chi_bird_tail"],
    },
  ],
];

const HOLD = [60, 75, 75];
const SIDE_HOLD = [30, 40, 45];
const BALANCE_HOLD = [15, 20, 25];

function practiceDay(w: number, plan: Plan): TemplateDay {
  const main = plan.moves.map((id) => {
    if (id === "tai_chi_rooster_balance") return t(id, 2, BALANCE_HOLD[w]);
    return t(id, 2, SIDED.has(id) ? SIDE_HOLD[w] : HOLD[w]);
  });
  return workout(plan.title, WARMUP, main, COOLDOWN);
}

const easyDay = (w: number) =>
  recovery(
    "Easy day: breathe and walk",
    [t("tai_chi_breathing", 1, 90, 0)],
    [t("tai_chi_walk_forward", 2, [60, 90, 90][w], 15), t("tai_chi_wave_hands", 1, 90, 0)],
    [t("tai_chi_closing", 1, 60, 0)],
  );

// Days 7 and 14 are easy days; day 21 finishes with the full flow.
const DAYS: TemplateDay[] = [
  ...WEEKS[0].map((p) => practiceDay(0, p)),
  easyDay(0),
  ...WEEKS[1].map((p) => practiceDay(1, p)),
  easyDay(1),
  ...WEEKS[2].slice(0, 5).map((p) => practiceDay(2, p)),
  easyDay(2),
  practiceDay(2, WEEKS[2][5]),
];

export const taiChiChallengeProgram: ProgramTemplate = {
  id: "tai-chi-challenge-21-day",
  guideSlug: "tai-chi-challenge",
  name: "21-day tai chi challenge",
  level: "beginner",
  equipment: ["chair"],
  days: DAYS,
};

export const taiChiChallengeGuide: Guide = {
  slug: "tai-chi-challenge",
  title: "21-Day Tai Chi Challenge",
  category: "program",
  summary:
    "A short tai chi practice every day for three weeks: 10–25 minutes of slow, easy sequences for posture, breathing, coordination and calm. Tick off each day on the printable tracker.",
  tags: ["TAI CHI", "DAILY", "CHALLENGE", "PRINTABLE"],
  readMinutes: 5,
  pattern: "stretch",
  programId: "tai-chi-challenge-21-day",
  caution:
    "If you have had a recent fall, feel unsteady, get dizzy, or have heart or lung disease, severe osteoporosis or a recent joint operation, check with your doctor first and keep a chair beside you throughout.",
  sections: [
    {
      heading: "Who it's for",
      blocks: [
        {
          kind: "p",
          text: "This challenge is about building a daily habit. Each day is a short, easy sequence of tai chi movements, so it's realistic to show up every day, even on busy ones.",
        },
        {
          kind: "list",
          items: [
            "Beginners who want a gentle daily routine. No experience is needed.",
            "People who have tried the Tai Chi Guide and want to keep practising.",
            "Anyone wanting a calm 15 minutes before work or before bed.",
          ],
        },
      ],
    },
    {
      heading: "What you'll gain",
      blocks: [
        {
          kind: "p",
          text: "Tai chi may improve balance and stability and reduce falls in older adults, according to the US National Center for Complementary and Integrative Health and a 2019 Cochrane review. Reviews also suggest longer and more frequent practice gives larger benefits, which is why a daily habit is worth building.",
        },
        {
          kind: "list",
          items: [
            "A habit: 21 days of small sessions makes practice feel normal.",
            "Better awareness of posture and a slower, steadier breath.",
            "Smoother coordination of arms, legs and trunk.",
          ],
        },
        { kind: "tip", text: "Three weeks is enough to learn the movements and notice how you feel. Bigger changes to balance usually take regular practice over a few months." },
      ],
    },
    {
      heading: "How the challenge works",
      blocks: [
        {
          kind: "list",
          items: [
            "Every session starts with breathing and weight shifts, and ends with the closing.",
            "Week 1: three movements a day, about 10–12 minutes.",
            "Week 2: four movements, slightly longer holds, about 14–16 minutes.",
            "Week 3: five movements, finishing on day 21 with the full flow.",
            "Days 7 and 14 are easy days: breathing, slow walking and clouds.",
          ],
        },
        { kind: "tip", text: "Same time, same place: tie your practice to something you already do, like after morning tea or before dinner." },
      ],
    },
    {
      heading: "Key movements in brief",
      blocks: [
        {
          kind: "list",
          items: [
            "Opening: hands float up as you breathe in, sink as you breathe out.",
            "Wave hands like clouds: hands pass the face and belly as the waist turns side to side.",
            "Brush knee and push: step, sweep one hand past the knee, push with the other.",
            "Parting the horse's mane: hold a ball, step on a diagonal, one hand rises and one presses down.",
            "Rooster stands on one leg: lift one knee with a hand on a chair.",
            "Grasp the bird's tail: ward off, roll back, press and push, all in one flow.",
            "Tai chi stepping: place the foot first, then shift your weight onto it.",
          ],
        },
        { kind: "p", text: "The Tai Chi Guide and Tai Chi Walking Guide explain each one in more detail." },
      ],
    },
    {
      heading: "Your 21 days",
      blocks: [dayTable(taiChiChallengeProgram.days)],
    },
    {
      heading: "Stay safe",
      blocks: [
        { kind: "caution", text: "Keep a sturdy chair or wall within reach for all balance and stepping work. Stop and sit if you feel dizzy or unwell." },
        { kind: "caution", text: "Missed a day? Simply continue. Don't do two sessions in one day to catch up." },
        {
          kind: "list",
          items: [
            "Keep the knees soft and over the toes. Raise the stance if your knees complain.",
            "Practise on a non-slip floor, barefoot or in flat shoes, not in socks on tiles.",
            "On hot days, choose the cooler hours and keep water nearby.",
          ],
        },
      ],
    },
    {
      heading: "Printable tracker",
      blocks: [
        { kind: "p", text: "Print this and stick it on the fridge. Tick each day once you've done it." },
        sessionChecklist(taiChiChallengeProgram.days),
      ],
    },
  ],
  sources: [SRC.nccihTaiChi, SRC.cochraneFalls, SRC.taiChiMeta2023],
};
