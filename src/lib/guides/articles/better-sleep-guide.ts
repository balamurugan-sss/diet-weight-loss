import type { Guide } from "../types";

export const betterSleepGuide: Guide = {
  slug: "better-sleep-guide",
  title: "The Better Sleep Guide",
  category: "trending",
  summary:
    "Simple habits, a chai cut-off and light dinners that make sleep come easier, plus a printable bedtime checklist and a 14-night sleep diary.",
  tags: ["SLEEP", "RECOVERY"],
  readMinutes: 4,
  pattern: "stretch",
  caution:
    "See a doctor if poor sleep goes on for weeks and affects your days, if you snore loudly and gasp or stop breathing in your sleep, or if you feel very sleepy while driving or at work.",
  sections: [
    {
      heading: "How much sleep you need",
      blocks: [
        {
          kind: "p",
          text: "Adults need at least 7 hours of sleep a night. Sleep is when muscles repair after training, appetite hormones reset and memory settles. Short sleep makes workouts feel harder and late-night snacking more tempting.",
        },
        {
          kind: "p",
          text: "Signs you are running short: you need an alarm and a snooze button every day, you sleep much longer on weekends, or you feel drowsy after lunch most days.",
        },
      ],
    },
    {
      heading: "Daytime habits that help at night",
      blocks: [
        {
          kind: "list",
          items: [
            "Wake up at the same time every day, weekends included. A fixed wake time is the strongest anchor for your body clock.",
            "Get daylight soon after waking: a short walk, your chai on the balcony, or opening the curtains.",
            "Be active during the day. If evening workouts keep you wired, move them earlier.",
            "If you nap, keep it short and early in the afternoon so it doesn't eat into night sleep.",
          ],
        },
      ],
    },
    {
      heading: "Caffeine and your chai cut-off",
      blocks: [
        {
          kind: "p",
          text: "Caffeine lingers for hours. In one sleep-lab study, a large dose of caffeine (400 mg) taken 6 hours before bed still cut total sleep by more than an hour, and people didn't notice it.",
        },
        {
          kind: "list",
          items: [
            "Set a cut-off at least 6 hours before bed. If you sleep at 11 pm, have your last chai or coffee by about 4–5 pm.",
            "Caffeine also hides in green tea, colas, energy drinks, pre-workout powders and dark chocolate.",
            "Switch the evening cup to something caffeine-free: warm milk, jeera or ajwain water, or a herbal infusion.",
            "Bonus for your iron levels: India's dietary guidelines advise not drinking tea or coffee within an hour of meals, because they reduce iron absorption.",
          ],
        },
      ],
    },
    {
      heading: "Eating for better sleep",
      blocks: [
        {
          kind: "p",
          text: "Your overall eating pattern matters more than any single 'sleep food'. A huge, oily or very spicy dinner late at night is a common reason for restless sleep and heartburn.",
        },
        {
          kind: "list",
          items: [
            "Finish dinner 2–3 hours before bed. If you get heartburn, leave 3–4 hours.",
            "Keep dinner light and familiar: dal with rice or roti, khichdi, curd rice, vegetable sabzi, grilled fish or chicken with salad.",
            "Save heavy biryani, fried snacks and rich gravies for lunch or the weekend.",
            "Skip the nightcap. Alcohol can make you drowsy, but it breaks up sleep later in the night.",
            "Drink enough water through the day, then ease off in the last hour so you're not up for the bathroom.",
          ],
        },
        {
          kind: "table",
          head: ["Hungry before bed?", "Why it may help"],
          rows: [
            ["Warm milk or haldi doodh (turmeric milk)", "A long-standing bedtime ritual; there is some science behind milk as a sleep aid"],
            ["A banana", "Easy on the stomach and contains magnesium"],
            ["A small bowl of curd rice", "Light, soothing and filling without being heavy"],
            ["A few almonds or pistachios", "Small, filling, and nuts naturally contain some melatonin"],
          ],
        },
        {
          kind: "tip",
          text: "Think of these as a calm wind-down ritual, not a sleeping pill. The routine of a warm drink at the same time each night is part of what helps.",
        },
      ],
    },
    {
      heading: "Wind-down and bedroom",
      blocks: [
        {
          kind: "list",
          items: [
            "Put screens away at least an hour before bed. Read, listen to music or a podcast, stretch, or do some slow breathing.",
            "Keep the room dark, quiet and cool. A fan or AC, blackout curtains, an eye mask and earplugs all help in noisy cities.",
            "Keep the bed for sleep. Work and long phone calls belong elsewhere.",
            "If worries keep you up, write them down with one next step for each, then close the notebook.",
            "Can't sleep? Don't lie there fighting it. Get up, do something quiet in dim light, and go back to bed when you feel sleepy.",
          ],
        },
      ],
    },
    {
      heading: "Your sleep checklist",
      blocks: [
        { kind: "p", text: "Print this and tick it off for a week. You don't need all of it; most people find two or three changes make the biggest difference." },
        {
          kind: "checklist",
          items: [
            "Woke up at my usual time (weekends too)",
            "Got daylight within an hour of waking",
            "Was physically active today (earlier rather than late)",
            "Last chai or coffee 6+ hours before bed",
            "Finished dinner 2–3 hours before bed",
            "No alcohol in the evening",
            "Screens away an hour before bed",
            "Room dark, quiet and cool",
            "Wrote down tomorrow's worries and to-dos",
            "In bed in time for 7+ hours of sleep",
          ],
        },
      ],
    },
    {
      heading: "14-night sleep diary",
      blocks: [
        {
          kind: "p",
          text: "Fill this in each morning for two weeks. Patterns jump out quickly, such as poor nights after late chai or heavy dinners. If you see a doctor about sleep, take it with you.",
        },
        {
          kind: "log",
          head: ["Night", "Bedtime", "Wake time", "Hours slept", "Last caffeine", "Dinner time", "Screens off", "Rested (1–5)"],
          rows: 14,
        },
      ],
    },
    {
      heading: "When to get help",
      blocks: [
        {
          kind: "list",
          items: [
            "Trouble falling or staying asleep most nights for weeks, despite good habits",
            "Loud snoring with gasping, choking or pauses in breathing (possible sleep apnoea)",
            "Feeling very sleepy during the day, especially while driving",
            "Restless, uncomfortable legs in the evening that stop you falling asleep",
            "Poor sleep alongside low mood or anxiety",
          ],
        },
      ],
    },
  ],
  sources: [
    { title: "CDC: Sleep in adults (FastStats)", url: "https://www.cdc.gov/sleep/data-and-statistics/Adults.html" },
    {
      title: "NHS Every Mind Matters: How to fall asleep faster and sleep better",
      url: "https://www.nhs.uk/every-mind-matters/mental-wellbeing-tips/how-to-fall-asleep-faster-and-sleep-better/",
    },
    {
      title: "Drake et al. (2013), Caffeine effects on sleep taken 0, 3, or 6 hours before going to bed (J Clin Sleep Med)",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3805807/",
    },
    {
      title: "Sleep Foundation: Food and drink that promote a good night's sleep",
      url: "https://www.sleepfoundation.org/articles/food-and-drink-promote-good-nights-sleep",
    },
    { title: "NHS: Heartburn and acid reflux", url: "https://www.nhs.uk/conditions/heartburn-and-acid-reflux/" },
    {
      title: "ICMR-NIN: Dietary Guidelines for Indians (2024)",
      url: "https://www.nin.res.in/dietaryguidelines/pdfjs/locale/DGI24thJune2024fin.pdf",
    },
  ],
};
