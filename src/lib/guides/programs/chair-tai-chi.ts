import type { Guide, ProgramTemplate, TemplateDay, TemplateItem } from "../types";
import { recovery, rest, t, weekGrid, workout } from "./helpers";
import { SRC } from "./sources";

const WARMUP = [t("chair_tai_chi_opening", 1, 60, 0), t("chair_heel_toe_rock", 1, 45, 0)];
const COOLDOWN = [t("chair_gentle_twist", 1, 30, 0), t("chair_tai_chi_closing", 1, 60, 0)];

const SECONDS = [40, 45, 50, 60];
const TITLES = ["Clouds and push", "Adding brush knee", "Adding horse's mane", "Full seated flow"];

function week(w: number): TemplateDay[] {
  const s = SECONDS[w];
  // Week 4 adds a third round of the opening moves.
  const sets = w >= 3 ? 3 : 2;
  const main: TemplateItem[] = [t("chair_weight_shift", 2, s), t("chair_wave_hands", sets, s), t("chair_push_gather", sets, s)];
  if (w >= 1) main.push(t("chair_brush_knee", 2, s - 10));
  if (w >= 2) main.push(t("chair_parting_mane", 2, s - 10));

  const flow = () => workout(`Seated flow: ${TITLES[w].toLowerCase()}`, WARMUP, [...main], COOLDOWN);
  const easy = recovery(
    "Breathing & ease",
    [t("chair_tai_chi_opening", 1, 60, 0)],
    [t("chair_weight_shift", 1, 60, 0), t("chair_heel_toe_rock", 1, 60, 0), t("chair_wave_hands", 1, 60, 0)],
    [t("chair_tai_chi_closing", 1, 90, 0)],
  );
  return [flow(), rest(), flow(), rest(), flow(), easy, rest()];
}

export const chairTaiChiProgram: ProgramTemplate = {
  id: "chair-tai-chi-4wk",
  guideSlug: "chair-tai-chi",
  name: "Chair tai chi: 4 weeks",
  level: "beginner",
  equipment: ["chair"],
  days: [0, 1, 2, 3].flatMap(week),
};

export const chairTaiChiGuide: Guide = {
  slug: "chair-tai-chi",
  title: "Chair Tai Chi Guide",
  category: "program",
  summary:
    "Gentle, seated tai chi for beginners, older adults and anyone with limited mobility: slow breathing, flowing arm movements and seated weight shifts, 10–25 minutes at a time.",
  tags: ["SEATED", "SENIORS", "GENTLE"],
  readMinutes: 6,
  pattern: "raise",
  programId: "chair-tai-chi-4wk",
  caution:
    "Talk to your doctor or physiotherapist first if you have had a recent fall, fracture, surgery or stroke, have heart or lung disease, low blood pressure that makes you dizzy, or severe joint pain.",
  sections: [
    {
      heading: "Who it's for",
      blocks: [
        {
          kind: "p",
          text: "Tai chi is a slow, flowing practice from China that links movement, breathing and attention. Every movement here is done sitting down, so you can practise safely even if standing for long is hard.",
        },
        {
          kind: "list",
          items: [
            "Older adults starting to exercise again.",
            "People recovering from illness, or with arthritis, back pain or poor balance, once their doctor agrees.",
            "Wheelchair users (lock the wheels) and anyone who spends long hours sitting at a desk.",
          ],
        },
      ],
    },
    {
      heading: "What you'll gain",
      blocks: [
        {
          kind: "p",
          text: "Most tai chi research is on standing practice, which has good evidence for better balance and fewer falls in older adults. Research on seated tai chi is newer and smaller. One trial in older wheelchair users found that seated tai chi three times a week for six months led to lower depression scores and better quality of life than usual activities.",
        },
        {
          kind: "list",
          items: [
            "Gentle movement for the shoulders, upper back, hips and ankles.",
            "A calm, steady breathing routine you can use any time.",
            "A stepping stone towards standing tai chi when you're ready.",
          ],
        },
        { kind: "tip", text: "Tai chi is low-risk, but it is not a replacement for medical care. Keep taking any treatment you've been prescribed." },
      ],
    },
    {
      heading: "Set up your chair",
      blocks: [
        {
          kind: "list",
          items: [
            "Use a sturdy chair without wheels or armrests that get in the way, placed against a wall.",
            "Sit near the front edge, feet flat and hip-width apart, knees about level with the hips.",
            "Sit tall, as if a thread gently lifts the top of your head. Relax the shoulders.",
            "Choose a cool, airy spot such as a balcony in the early morning, and keep water nearby.",
          ],
        },
      ],
    },
    {
      heading: "How to do the key movements",
      blocks: [
        {
          kind: "list",
          ordered: true,
          items: [
            "Opening and breathing: hands float up to shoulder height as you breathe in, sink as you breathe out.",
            "Weight shifts: lean slowly side to side, then forwards and back, keeping the head over the body.",
            "Wave hands like clouds: one hand at face height, one at belly height, turning gently side to side.",
            "Push and gather: palms push forwards on the out-breath and draw back on the in-breath.",
            "Brush knee and push (week 2): one hand sweeps past the knee as the other pushes forwards.",
            "Parting the horse's mane (week 3): hands hold an imaginary ball, then one rises diagonally and one presses down.",
            "Closing: hands cross at the chest and float down to the thighs. Sit for a few breaths.",
          ],
        },
        { kind: "tip", text: "Move at about 70% of your comfortable range. Smooth and slow is more important than big." },
      ],
    },
    {
      heading: "Your weekly schedule",
      blocks: [
        { kind: "p", text: "Three seated flows and one short breathing day each week. A new movement joins each week, and each one is held a little longer." },
        weekGrid(chairTaiChiProgram.days),
      ],
    },
    {
      heading: "How to progress",
      blocks: [
        {
          kind: "list",
          items: [
            "Only add the new movement when last week's feel easy and smooth.",
            "If a session tires you, do one round of each movement instead of two.",
            "After four weeks, keep practising the full flow, or ask your doctor about moving to the standing Tai Chi Guide.",
          ],
        },
      ],
    },
    {
      heading: "Stay safe",
      blocks: [
        { kind: "caution", text: "Stop and rest if you feel dizzy, short of breath, have chest pain or feel unwell. Seek medical help if it doesn't pass quickly." },
        { kind: "caution", text: "Stand up slowly after the closing: sit for a few breaths first, then stand with a hand on the chair or a table." },
        {
          kind: "list",
          items: [
            "Never twist or reach to the point of pain.",
            "Breathe naturally. Don't hold the breath or force deep breaths.",
            "If you use a wheelchair, lock the brakes before you start.",
          ],
        },
      ],
    },
    {
      heading: "Printable tracker",
      blocks: [
        {
          kind: "log",
          head: ["Date", "Session", "Minutes", "How I felt before (1–5)", "How I felt after (1–5)"],
          rows: 16,
        },
      ],
    },
  ],
  sources: [SRC.nccihTaiChi, SRC.seatedTaiChiTrial, SRC.cochraneFalls, SRC.cdcOlderWhatCounts],
};
