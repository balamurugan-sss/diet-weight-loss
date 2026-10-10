import type { Guide, ProgramTemplate, TemplateDay, TemplateItem } from "../types";
import { recovery, rest, t, weekGrid, workout } from "./helpers";
import { SRC } from "./sources";

const WARMUP = [t("march_in_place", 1, 60, 0), t("tai_chi_weight_shift", 1, 60, 0)];
const COOLDOWN = [t("quad_stretch", 1, 30, 0), t("tai_chi_breathing", 1, 60, 0)];

const TITLES = ["Empty and full steps", "Adding backward steps", "Stepping with balance", "Walking flow"];

function week(w: number): TemplateDay[] {
  const main: TemplateItem[] = [
    t("tai_chi_opening", 1, 60, 0),
    t("tai_chi_walk_forward", 3, [60, 90, 90, 120][w], 30),
    t("tai_chi_walk_sideways", [2, 2, 3, 3][w], 60, 30),
  ];
  if (w >= 1) main.push(t("tai_chi_walk_backward", [0, 2, 2, 3][w], [0, 45, 60, 60][w], 30));
  if (w >= 2) main.push(t("tai_chi_rooster_balance", 2, [0, 0, 15, 20][w], 15));
  if (w >= 3) main.push(t("tai_chi_wave_hands", 2, 60, 15));

  const flow = () => workout(TITLES[w], WARMUP, [...main], COOLDOWN);
  const easy = recovery(
    "Easy outdoor walk",
    [t("march_in_place", 1, 60, 0)],
    [t("brisk_walk", 1, [600, 900, 900, 1200][w], 0), t("tai_chi_walk_forward", 1, 120, 0)],
    [t("tai_chi_breathing", 1, 60, 0)],
  );
  return [flow(), rest(), flow(), rest(), flow(), easy, rest()];
}

export const taiChiWalkingProgram: ProgramTemplate = {
  id: "tai-chi-walking-4wk",
  guideSlug: "tai-chi-walking",
  name: "Tai chi walking: 4 weeks",
  level: "beginner",
  equipment: ["chair"],
  days: [0, 1, 2, 3].flatMap(week),
};

export const taiChiWalkingGuide: Guide = {
  slug: "tai-chi-walking",
  title: "Tai Chi Walking Guide",
  category: "program",
  summary:
    "Slow, deliberate stepping that trains balance, posture and breath: forward heel-to-toe steps, side steps and supported backward steps, built up over four weeks.",
  tags: ["TAI CHI", "WALKING", "BALANCE"],
  readMinutes: 6,
  pattern: "march",
  programId: "tai-chi-walking-4wk",
  caution:
    "If you have fallen recently, use a walking aid, have dizziness, numbness in the feet, or a recent hip, knee or ankle injury, check with your doctor or physiotherapist first and practise with someone nearby.",
  sections: [
    {
      heading: "Who it's for",
      blocks: [
        {
          kind: "p",
          text: "Tai chi walking slows ordinary walking right down so you can feel each step: placing the foot, shifting weight onto it and finding balance before the next one. It suits beginners, older adults and anyone who wants steadier, more confident walking.",
        },
        {
          kind: "list",
          items: [
            "You can walk on your own indoors, with or without a hand on a wall.",
            "You have a clear path of 3–4 metres, ideally along a wall or kitchen counter.",
            "You can spare 15–30 minutes, three days a week.",
          ],
        },
      ],
    },
    {
      heading: "What you'll gain",
      blocks: [
        {
          kind: "p",
          text: "Balance and walking exercise has strong evidence for preventing falls: a 2019 Cochrane review found that balance and functional exercises cut the rate of falls in older people by about 24% (high-certainty evidence). Reviews of tai chi trials report gains in walking speed and balance tests too. Results in single small trials are more mixed, so regular practice over months matters.",
        },
        {
          kind: "list",
          items: [
            "More control when shifting weight from one foot to the other: the heart of every step.",
            "Better awareness of posture while moving.",
            "A calm, mindful walk you can do anywhere: a corridor, a terrace or a park path.",
          ],
        },
      ],
    },
    {
      heading: "How to do the key steps",
      blocks: [
        { kind: "h", text: "Empty and full" },
        {
          kind: "p",
          text: "In tai chi, a leg holding your weight is 'full' and a leg with no weight is 'empty'. Each step places an empty foot first, then slowly fills it. You should be able to stop at any moment without falling into the step.",
        },
        {
          kind: "list",
          ordered: true,
          items: [
            "Forward steps: sink onto the back leg, place the front heel lightly, roll through the foot and shift your weight forwards. Bring the back foot alongside, pause, repeat.",
            "Side steps: facing a wall with fingertips on it, step out to the side toes first, shift across, then draw the other foot in.",
            "Backward steps (week 2): side-on to a counter, reach the toes back, lower the heel, shift your weight back. Check the path behind you first.",
            "Rooster balance (week 3): pause on one leg between steps, holding the support.",
            "Walking with clouds (week 4): add the slow 'wave hands' arm movement as you side-step.",
          ],
        },
        { kind: "tip", text: "Breathe in as you place the foot and breathe out as you shift your weight. Eyes look ahead, not down at your feet." },
      ],
    },
    {
      heading: "Your weekly schedule",
      blocks: [
        { kind: "p", text: "Three stepping sessions and one easy walk outdoors each week. Steps get longer in time, then backward steps and balance pauses are added." },
        weekGrid(taiChiWalkingProgram.days),
      ],
    },
    {
      heading: "How to progress",
      blocks: [
        {
          kind: "list",
          items: [
            "Slow down before you speed up: a slower step needs more balance, not less.",
            "Go from a full hand on the wall to fingertips, then to hovering the hand just off it.",
            "Make the stance a little wider for more stability, a little narrower for more challenge.",
            "Once all four weeks feel easy, practise the forward steps on your daily walk for a minute at a time.",
          ],
        },
      ],
    },
    {
      heading: "Stay safe",
      blocks: [
        { kind: "caution", text: "Always practise beside a wall, counter or sturdy chair. Never practise backward walking in open space or on stairs." },
        { kind: "caution", text: "Stop and sit down if you feel dizzy, light-headed or unwell." },
        {
          kind: "list",
          items: [
            "Clear the floor of mats, wires and toys. Avoid wet or polished floors.",
            "Wear flat, non-slip shoes, or practise barefoot on a dry, non-slip surface.",
            "Outdoors, choose an even path and the cooler hours of the day.",
          ],
        },
      ],
    },
    {
      heading: "Printable tracker",
      blocks: [
        {
          kind: "log",
          head: ["Date", "Session", "Hand support (full / fingertips / none)", "Balance hold (s)", "Notes"],
          rows: 16,
        },
      ],
    },
  ],
  sources: [SRC.cochraneFalls, SRC.taiChiMeta2023, SRC.nccihWalking, SRC.nccihTaiChi],
};
