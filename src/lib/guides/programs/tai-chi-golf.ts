import type { Guide, ProgramTemplate, TemplateDay } from "../types";
import { recovery, rest, t, weekGrid, workout } from "./helpers";
import { SRC } from "./sources";

const WARMUP = [t("march_in_place", 1, 60, 0), t("hip_circles", 1, 30, 0), t("golf_hip_turn", 1, 45, 0)];
const COOLDOWN = [t("hamstring_stretch", 1, 40, 0), t("quad_stretch", 1, 30, 0), t("tai_chi_breathing", 1, 60, 0)];

function week(w: number): TemplateDay[] {
  const s = [45, 50, 60, 60][w];
  const side = [25, 30, 30, 40][w];
  const sets = w < 2 ? 2 : 3;

  const rotation = workout(
    `Rotation & posture (week ${w + 1})`,
    WARMUP,
    [
      t("golf_shoulder_turn", sets, s),
      t("tai_chi_wave_hands", 2, s),
      t("golf_split_stance_rotation", sets, side),
      t("worlds_greatest_stretch", 2, side),
      ...(w >= 2 ? [t("side_plank", 2, [0, 0, 20, 25][w], 20)] : []),
    ],
    COOLDOWN,
  );

  const balance = workout(
    `Weight transfer & balance (week ${w + 1})`,
    WARMUP,
    [
      t("tai_chi_weight_shift", 2, s),
      t("golf_weight_transfer", sets, s),
      t("tai_chi_rooster_balance", 2, [15, 20, 20, 25][w]),
      t("tai_chi_brush_knee", 2, side),
      ...(w >= 2 ? [t("golf_single_leg_reach", 2, [0, 0, 20, 25][w])] : []),
    ],
    COOLDOWN,
  );

  const swingFlow = workout(
    `Slow swing flow (week ${w + 1})`,
    WARMUP,
    [
      t("golf_weight_transfer", 2, s),
      t("golf_slow_swing", sets, 60),
      t("golf_shoulder_turn", 2, s),
      ...(w >= 1 ? [t("tai_chi_parting_mane", 2, side)] : []),
      t("golf_split_stance_rotation", 2, side),
    ],
    COOLDOWN,
  );

  const preRound = recovery(
    "Pre-round warm-up",
    [t("march_in_place", 1, 60, 0)],
    [
      t("golf_hip_turn", 1, 45, 0),
      t("golf_shoulder_turn", 1, 45, 0),
      t("worlds_greatest_stretch", 1, 30, 0),
      t("golf_weight_transfer", 1, 45, 0),
      t("golf_slow_swing", 1, 60, 0),
    ],
    [t("tai_chi_breathing", 1, 45, 0)],
  );

  return [rotation, rest(), balance, rest(), swingFlow, preRound, rest()];
}

export const taiChiGolfProgram: ProgramTemplate = {
  id: "tai-chi-golf-4wk",
  guideSlug: "tai-chi-for-golfers",
  name: "Tai chi for golfers: 4 weeks",
  level: "beginner",
  equipment: ["chair"],
  days: [0, 1, 2, 3].flatMap(week),
};

export const taiChiGolfGuide: Guide = {
  slug: "tai-chi-for-golfers",
  title: "Tai Chi for Golfers",
  category: "program",
  summary:
    "Slow, tai chi-style drills for the parts of the golf swing that matter off the course: hip and upper-back rotation, smooth weight transfer, balance and a steady trunk.",
  tags: ["GOLF", "TAI CHI", "MOBILITY"],
  readMinutes: 6,
  pattern: "lunge",
  programId: "tai-chi-golf-4wk",
  caution:
    "If you have current back, hip or shoulder pain, a recent joint replacement or spinal surgery, or osteoporosis, get advice from a doctor or physiotherapist before doing rotation drills.",
  sections: [
    {
      heading: "Who it's for",
      blocks: [
        {
          kind: "p",
          text: "This plan is for recreational golfers of any level who want to move better through the swing and look after their back. No club or course is needed for most of it; a living room or a terrace is enough.",
        },
        {
          kind: "list",
          items: [
            "Golfers who feel stiff in the hips or upper back, especially after a desk job.",
            "Golfers who sway or lose balance through the swing.",
            "Anyone who wants a short, reliable warm-up before a round or a range session.",
          ],
        },
      ],
    },
    {
      heading: "What you'll gain",
      blocks: [
        {
          kind: "p",
          text: "Let's be clear about the evidence. There are no good trials of tai chi for golfers specifically. What we do know: low back problems are the most common complaint in golfers, and the modern swing asks for a large turn of the upper body over the hips. Reviews link tai chi to better balance and smooth weight shifting. In one randomised trial with 344 golfers, a regular golf-specific warm-up was linked to fewer injuries, especially serious ones.",
        },
        {
          kind: "list",
          items: [
            "More comfortable turning through the hips and upper back, so the lower back doesn't have to do it all.",
            "A smoother shift from the trail leg to the lead leg.",
            "Steadier balance through the finish.",
            "A ready-made 10-minute pre-round warm-up.",
          ],
        },
        { kind: "tip", text: "We make no promises about distance or scores. Treat any improvement there as a bonus; moving well and staying on the course is the goal." },
      ],
    },
    {
      heading: "How to do the key drills",
      blocks: [
        {
          kind: "list",
          ordered: true,
          items: [
            "Hip turns: in golf posture with arms crossed, turn the belt buckle side to side while the chest stays quiet.",
            "Shoulder turns: same posture, keep the hips steady and turn the upper back. Never bounce at the end.",
            "Weight transfer: in a wide stance, take four slow counts to load the trail leg and four to glide into the lead leg.",
            "Slow-motion swing: five seconds back, five seconds through, finishing tall and balanced on the lead leg.",
            "Split-stance rotation: hips face forwards while the chest and hands turn, training the trunk to control rotation.",
            "Balance: tai chi's one-leg 'rooster' and the single-leg reach, always with a chair within reach.",
          ],
        },
        { kind: "tip", text: "Move like tai chi: slow, continuous, with the breath. If you can't do a drill slowly, you can't control it at speed." },
      ],
    },
    {
      heading: "Your weekly schedule",
      blocks: [
        { kind: "p", text: "Three 15–25 minute sessions and the 8-minute pre-round warm-up, which you can move to whichever day you play." },
        weekGrid(taiChiGolfProgram.days),
      ],
    },
    {
      heading: "How to progress",
      blocks: [
        {
          kind: "list",
          items: [
            "Weeks 1–2: learn the drills and find a comfortable range.",
            "Weeks 3–4: more rounds, longer holds, plus side planks and single-leg reaches for trunk and hip control.",
            "Turn a little further only when the current range feels easy and pain-free.",
            "Afterwards, keep two sessions a week and the warm-up before every round.",
          ],
        },
      ],
    },
    {
      heading: "Stay safe",
      blocks: [
        { kind: "caution", text: "Rotation should feel like a gentle stretch, never a pinch or sharp pain in the back. Stop any drill that brings on pain, numbness or tingling." },
        { kind: "caution", text: "Do balance drills beside a chair or wall, and stop if you feel dizzy or unwell." },
        {
          kind: "list",
          items: [
            "Warm up before hitting balls, not after. A cold back plus a full-speed drive is a common way to get hurt.",
            "On hot days, drink water before and during your round and rest in shade between holes.",
            "If back pain lasts more than a few days or spreads down the leg, see a doctor.",
          ],
        },
      ],
    },
    {
      heading: "Printable tracker",
      blocks: [
        {
          kind: "log",
          head: ["Date", "Session", "Turn feels (stiff / OK / free)", "Balance hold (s)", "Notes"],
          rows: 16,
        },
      ],
    },
  ],
  sources: [SRC.golfBackReview, SRC.golfWarmupTrial, SRC.taiChiMeta2023, SRC.nccihTaiChi],
};
