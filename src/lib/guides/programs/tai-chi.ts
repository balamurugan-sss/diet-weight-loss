import type { Guide, ProgramTemplate, TemplateDay, TemplateItem } from "../types";
import { recovery, rest, t, weekGrid, workout } from "./helpers";
import { SRC } from "./sources";

const WARMUP = [t("march_in_place", 1, 60, 0), t("hip_circles", 1, 30, 0), t("arm_circles", 1, 30, 0)];
const COOLDOWN = [t("tai_chi_closing", 1, 60, 0), t("tai_chi_breathing", 1, 60, 0)];

const TITLES = ["Opening & clouds", "Adding brush knee", "Mane & rooster", "Bird's tail & full flow"];

function week(w: number): TemplateDay[] {
  const s = [45, 60, 60, 60][w];
  const side = [30, 30, 40, 45][w];
  const main: TemplateItem[] = [t("tai_chi_opening", 2, s), t("tai_chi_weight_shift", 2, s), t("tai_chi_wave_hands", 2, s)];
  if (w >= 1) main.push(t("tai_chi_brush_knee", 2, side));
  if (w >= 2) main.push(t("tai_chi_parting_mane", 2, side), t("tai_chi_rooster_balance", 2, [0, 0, 15, 20][w]));
  if (w >= 3) main.push(t("tai_chi_bird_tail", 2, side));

  const flow = () => workout(TITLES[w], WARMUP, [...main], COOLDOWN);
  const easy = recovery(
    "Breathing & easy walk",
    [t("tai_chi_breathing", 1, 60, 0)],
    [t("brisk_walk", 1, [600, 600, 900, 900][w], 0), t("tai_chi_wave_hands", 1, 60, 0)],
    [t("tai_chi_closing", 1, 60, 0)],
  );
  return [flow(), rest(), flow(), rest(), flow(), easy, rest()];
}

export const taiChiProgram: ProgramTemplate = {
  id: "tai-chi-beginner-4wk",
  guideSlug: "tai-chi-guide",
  name: "Tai chi for beginners: 4 weeks",
  level: "beginner",
  equipment: ["chair"],
  days: [0, 1, 2, 3].flatMap(week),
};

export const taiChiGuide: Guide = {
  slug: "tai-chi-guide",
  title: "Tai Chi Guide",
  category: "program",
  summary:
    "Learn eight simple standing tai chi movements over four weeks, one or two at a time, with attention to posture, slow breathing and smooth weight shifts.",
  tags: ["TAI CHI", "BEGINNER", "BALANCE"],
  readMinutes: 7,
  pattern: "stretch",
  programId: "tai-chi-beginner-4wk",
  caution:
    "Check with your doctor first if you have had a fall in the past year, feel unsteady on your feet, have dizziness, severe osteoporosis, a recent joint replacement, or heart or lung disease.",
  sections: [
    {
      heading: "Who it's for",
      blocks: [
        {
          kind: "p",
          text: "This is a gentle introduction to standing tai chi for complete beginners of any age. The movements are simplified from the widely taught Yang-style short forms, so you can follow them at home without a teacher.",
        },
        {
          kind: "list",
          items: [
            "You can stand for 10–25 minutes, with a chair nearby to hold or sit on if needed.",
            "You want to improve balance, posture and calm, without high effort.",
            "You have a small clear space: a room, a terrace or a quiet corner of a park.",
          ],
        },
      ],
    },
    {
      heading: "What you'll gain",
      blocks: [
        {
          kind: "p",
          text: "The US National Center for Complementary and Integrative Health notes that tai chi may improve balance and stability in older people and lower the risk of falls. A 2019 Cochrane review found low-certainty evidence that tai chi may reduce the rate of falls by about 19%. Reviews of trials also report better walking speed and balance test scores, with bigger effects from longer, more regular practice.",
        },
        {
          kind: "p",
          text: "In a 2016 trial in people with knee osteoarthritis, twelve weeks of tai chi helped pain and function about as much as physiotherapy did.",
        },
        {
          kind: "list",
          items: [
            "Steadier balance and more confident weight shifting.",
            "Gentle strength in the legs from the slightly bent-knee stance.",
            "A calm, slow breathing rhythm.",
          ],
        },
        { kind: "tip", text: "Tai chi is gentle. Brisk walking on other days helps you reach the WHO's 150 minutes of moderate activity a week; the plan includes one easy walk." },
      ],
    },
    {
      heading: "Posture and breathing",
      blocks: [
        {
          kind: "list",
          items: [
            "Feet hip-width or a little wider, weight spread over the whole foot.",
            "Knees soft, never locked, and pointing the same way as the toes.",
            "Tall spine, chin slightly tucked, shoulders and elbows relaxed and heavy.",
            "Breathe slowly through the nose. Let the breath follow the movement; never force it.",
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
            "Opening: hands float up to shoulder height as you breathe in, then sink to the hips as you bend the knees a little.",
            "Weight shifts: move your weight slowly from foot to foot, then front to back, keeping your head level.",
            "Wave hands like clouds: one hand passes the face as the other passes the belly, turning from the waist.",
            "Brush knee and push (week 2): step the heel forwards, one hand sweeps past the knee and the other pushes ahead.",
            "Parting the horse's mane (week 3): hold an imaginary ball at the hip, step out on a diagonal, then one hand rises and the other presses down.",
            "Rooster stands on one leg (week 3): with one hand on a chair, lift one knee slowly and hold for a breath or two.",
            "Grasp the bird's tail (week 4): four linked parts, ward off, roll back, press and push, moving the whole body.",
            "Closing: hands cross at the chest and float down. Stand still for a few breaths.",
          ],
        },
        { kind: "tip", text: "Step first, then shift your weight. Place the foot like you are testing ice, and only move onto it once it is set." },
      ],
    },
    {
      heading: "Your weekly schedule",
      blocks: [
        { kind: "p", text: "Three practice days and one easy walking day each week. Each week adds one or two movements to what you already know." },
        weekGrid(taiChiProgram.days),
      ],
    },
    {
      heading: "How to progress",
      blocks: [
        {
          kind: "list",
          items: [
            "Get smoother before you get bigger: make each movement continuous before deepening the stance.",
            "Lower the stance only as far as your knees are comfortable.",
            "For balance work, go from two hands on the chair to one, then to fingertips. Never let go before you're steady.",
            "After week 4, practise the full sequence daily, or try the Tai Chi Walking Guide or the Tai Chi Challenge.",
          ],
        },
      ],
    },
    {
      heading: "Stay safe",
      blocks: [
        { kind: "caution", text: "Do balance movements beside a sturdy chair, kitchen counter or wall. Stop if you feel dizzy, and sit down until it passes." },
        { kind: "caution", text: "Knee pain usually means the knee is too far forwards or turning inwards. Raise the stance and keep the knee over the toes." },
        {
          kind: "list",
          items: [
            "Practise barefoot on a non-slip floor or in flat shoes. Socks on marble or tiles are slippery.",
            "In summer, practise in the early morning or evening, in shade, and drink water.",
            "Minor aches can happen when starting. Sharp pain is a sign to stop.",
          ],
        },
      ],
    },
    {
      heading: "Printable tracker",
      blocks: [
        {
          kind: "log",
          head: ["Date", "Movements practised", "Minutes", "Balance hold (s)", "Notes"],
          rows: 16,
        },
      ],
    },
  ],
  sources: [SRC.nccihTaiChi, SRC.cochraneFalls, SRC.taiChiMeta2023, SRC.nccihKneeOa],
};
