import type { Guide } from "../types";

export const consistentWorkoutProgress: Guide = {
  slug: "consistent-workout-progress",
  title: "Keys to Consistent Workout Progress",
  category: "trending",
  summary:
    "Progress comes from small, steady increases, careful tracking and enough recovery, not from wrecking yourself every session. Here's how to keep getting stronger.",
  tags: ["STRENGTH", "TRAINING"],
  readMinutes: 4,
  pattern: "press",
  sections: [
    {
      heading: "Consistency beats intensity",
      blocks: [
        {
          kind: "p",
          text: "The people who make the most progress are rarely the ones with the hardest workouts. They are the ones who show up week after week for months. A good-enough session you actually do beats a perfect plan you skip.",
        },
        {
          kind: "list",
          items: [
            "Strength train on at least 2 days a week, working all the major muscle groups. Beginners do well on 2–3 sessions a week.",
            "Finish most sets with 1–3 reps still 'in the tank'. Going to failure every set adds fatigue faster than it adds results.",
            "Judge progress over months, not single sessions. Bad days are normal.",
          ],
        },
      ],
    },
    {
      heading: "Progressive overload, explained",
      blocks: [
        {
          kind: "p",
          text: "Muscles adapt to what you ask of them, then stop changing. To keep improving, you gradually ask a little more. That is progressive overload. You can add:",
        },
        {
          kind: "list",
          items: [
            "Reps: one more rep with the same weight",
            "Load: a small weight increase once you beat your target reps",
            "Sets: one extra set for a muscle that's lagging",
            "Difficulty: a harder version of a bodyweight move, such as knee push-ups, then full push-ups, then feet-raised push-ups",
            "Control: slower lowering and cleaner form at the same weight",
          ],
        },
        {
          kind: "p",
          text: "A common guideline is to increase the load by about 2–10% once you can do 1–2 reps more than your target. Small jumps are fine.",
        },
      ],
    },
    {
      heading: "Double progression, step by step",
      blocks: [
        {
          kind: "list",
          ordered: true,
          items: [
            "Pick a rep range for each exercise, for example 8–12.",
            "Start with a weight you could lift for 2–3 more reps than you do.",
            "Each session, try to add a rep or two at the same weight.",
            "When every set reaches the top of the range (12), add the smallest weight jump available.",
            "Your reps will drop back towards 8. Build them up again, and repeat.",
          ],
        },
        {
          kind: "table",
          head: ["Session", "Weight", "Reps (3 sets)", "Next time"],
          rows: [
            ["1", "10 kg", "10, 9, 8", "Same weight"],
            ["2", "10 kg", "11, 10, 10", "Same weight"],
            ["3", "10 kg", "12, 12, 12", "Add weight"],
            ["4", "12 kg", "9, 8, 8", "Build reps again"],
          ],
        },
        {
          kind: "tip",
          text: "Movewell does this for you. When every planned set reaches the top of the range, the session player suggests the smallest practical jump (for example 2.5 kg on an upper-body barbell lift, or 1–2 kg on dumbbells). If most sets fall short of the bottom of the range, it suggests stepping back. For bodyweight moves it adds 2 reps or offers a harder variation, and for timed holds it adds 5–10 seconds.",
        },
      ],
    },
    {
      heading: "Track every set",
      blocks: [
        {
          kind: "p",
          text: "Memory is a poor training log. Writing down weight and reps takes seconds and shows you exactly what to beat next time. The app logs your sets, shows last session's numbers before each exercise, and charts your strength over time.",
        },
        { kind: "p", text: "Training on paper? Use this log:" },
        {
          kind: "log",
          head: ["Date", "Exercise", "Weight (kg)", "Reps per set", "Reps left in tank", "Notes"],
          rows: 12,
        },
      ],
    },
    {
      heading: "Recover so you can progress",
      blocks: [
        {
          kind: "list",
          items: [
            "Sleep: aim for at least 7 hours. Muscle is built while you rest, not during the workout.",
            "Protein: about 1.4–2.0 g per kg of body weight a day suits most people who train. Spread it over your meals: dal, paneer, curd, eggs, chicken, fish or soy.",
            "Rest days: they're part of the plan. In Movewell, planned rest days never break your streak.",
            "Eat enough: strength gains slow down a lot in a big calorie deficit.",
          ],
        },
        { kind: "h", text: "Deloads" },
        {
          kind: "p",
          text: "A deload is a planned short period, usually about a week, of easier training. You lower the volume, the load or how hard you push, so built-up fatigue can clear. Keep the same exercises, do fewer sets, and leave more reps in the tank. Most people come back feeling stronger.",
        },
        {
          kind: "p",
          text: "Signs you may need one: your lifts have stalled or dropped for a couple of weeks, your joints ache, you sleep badly, or you dread sessions you usually enjoy.",
        },
      ],
    },
    {
      heading: "When progress stalls, check these",
      blocks: [
        {
          kind: "checklist",
          items: [
            "Sleeping 7+ hours most nights",
            "Eating enough protein and not crash dieting",
            "Same exercises long enough to improve at them (4+ weeks)",
            "Actually logging and trying to beat last time",
            "Form is consistent, and reps aren't getting shorter",
            "Not doing far more sets than I can recover from",
            "Life stress (work, exams, travel, festivals) taken into account",
          ],
        },
      ],
    },
    {
      heading: "Make it stick",
      blocks: [
        {
          kind: "list",
          items: [
            "Schedule sessions like meetings: same days, same time.",
            "Have a 'minimum session' for busy days: one set of each main exercise is still a win.",
            "Pack your gym bag or lay out your mat the night before.",
            "Missed a week? Don't try to catch up. Restart at a slightly lighter weight and build back.",
          ],
        },
      ],
    },
  ],
  sources: [
    {
      title: "ACSM position stand: Progression models in resistance training for healthy adults (2009)",
      url: "https://pubmed.ncbi.nlm.nih.gov/19204579/",
    },
    {
      title: "Bell et al. (2023), Integrating deloading into strength and physique sports training programmes: a Delphi consensus",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10511399/",
    },
    { title: "WHO: Physical activity fact sheet", url: "https://www.who.int/news-room/fact-sheets/detail/physical-activity" },
    {
      title: "ISSN position stand: protein and exercise (Jäger et al., 2017)",
      url: "https://pubmed.ncbi.nlm.nih.gov/28642676/",
    },
    { title: "CDC: Sleep in adults (FastStats)", url: "https://www.cdc.gov/sleep/data-and-statistics/Adults.html" },
  ],
};
