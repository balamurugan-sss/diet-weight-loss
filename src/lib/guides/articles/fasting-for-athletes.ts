import type { Guide } from "../types";

export const fastingForAthletes: Guide = {
  slug: "fasting-for-athletes",
  title: "Fasting and Training: A Practical Guide",
  category: "trending",
  summary:
    "How to train well with intermittent fasting, time-restricted eating, or Ramadan, Navratri and Ekadashi fasts: what studies show, how to keep your muscle, and who shouldn't fast.",
  tags: ["FASTING", "NUTRITION", "TRAINING"],
  readMinutes: 4,
  pattern: "march",
  caution:
    "Don't fast without your doctor's advice if you have diabetes (especially if you take insulin or sulfonylureas such as glimepiride or gliclazide), are pregnant or breastfeeding, have a history of an eating disorder, are under 18, or have kidney disease or another long-term condition.",
  sections: [
    {
      heading: "The main types of fasting",
      blocks: [
        {
          kind: "list",
          items: [
            "Time-restricted eating (TRE): you eat within a daily window, such as 16:8 (eating between 12 pm and 8 pm, then fasting for 16 hours).",
            "Intermittent fasting (IF): very low-calorie or no-food days, such as 5:2 or alternate days.",
            "Ramadan: no food or water from dawn (sehri) to sunset (iftar) for a month.",
            "Navratri: nine days, often with grains avoided and one main meal or 'falahar' (fruit, milk, sabudana, kuttu, singhara, rajgira).",
            "Ekadashi: twice a month. It ranges from avoiding grains to a full fast, and some people fast without water (nirjala).",
          ],
        },
      ],
    },
    {
      heading: "What the research shows",
      blocks: [
        {
          kind: "list",
          items: [
            "For fat loss, fasting works the same way as any diet: by creating a calorie deficit. Reviews find no clear body-composition advantage of intermittent fasting over simply eating a little less every day.",
            "Muscle can be kept. In an 8-week study of 34 resistance-trained men, those eating all their food in an 8-hour window (16:8), with the same calories and training as the other group, lost fat and kept their muscle.",
            "During Ramadan, reviews usually find small drops in performance, mostly in hard, repeated efforts and in late-afternoon sessions, when the body's fuel and fluid stores are lowest.",
            "Fasting is a scheduling tool. It isn't magic, and it isn't required. If it helps you control your eating and you feel good, it's an option. If it leaves you bingeing or training badly, drop it.",
          ],
        },
      ],
    },
    {
      heading: "Keeping your muscle while fasting",
      blocks: [
        {
          kind: "list",
          items: [
            "Hit your daily protein: about 1.4–2.0 g per kg of body weight. A shorter eating window doesn't change how much you need.",
            "Split it over 2–3 meals in your window, with roughly 20–40 g of protein in each.",
            "Keep strength training. It's the signal that tells your body to hold on to muscle.",
            "Vegetarian protein: paneer, hung curd, milk, dal, chana, rajma, soy chunks, tofu, sprouts.",
            "Non-vegetarian protein: eggs, chicken, fish, mutton keema (lean).",
            "Navratri-friendly protein: paneer, curd, milk, makhana, peanuts, rajgira and singhara flour, and nuts.",
          ],
        },
      ],
    },
    {
      heading: "Timing training and meals",
      blocks: [
        {
          kind: "table",
          head: ["Fasting pattern", "When to train", "What to eat"],
          rows: [
            [
              "16:8 or similar window",
              "Late morning to evening, inside or just before your eating window",
              "A protein-rich meal soon after training",
            ],
            [
              "Ramadan",
              "A light session shortly before iftar, or harder training a couple of hours after iftar",
              "Open the fast with water and dates, then a proper meal with protein. At sehri: slow carbs (oats, roti, poha), protein, fruit and plenty of fluid.",
            ],
            [
              "Navratri / one-meal days",
              "Shorter, lighter sessions, ideally after your main meal",
              "Build meals around paneer, curd, milk and peanuts, not only fried sabudana vada, pakoras and sweets",
            ],
            [
              "Ekadashi / nirjala (no water)",
              "Rest, or a gentle walk or stretch",
              "Rehydrate well and eat a balanced meal when you break the fast",
            ],
          ],
        },
        {
          kind: "tip",
          text: "On fasting days, swap sprints and heavy max lifts for steady technique work. Save your hardest sessions for days when you're fed and hydrated.",
        },
      ],
    },
    {
      heading: "Who should not fast (or only with medical advice)",
      blocks: [
        {
          kind: "list",
          items: [
            "People with diabetes on insulin or sulfonylureas: the risk of low blood sugar is real. Get a pre-fast check with your doctor; doses often need changing.",
            "Pregnant or breastfeeding women",
            "Anyone with a current or past eating disorder",
            "Under 18s, who need regular fuel to grow",
            "People with kidney disease, low blood pressure, a history of fainting, or on medicines that must be taken with food",
          ],
        },
        {
          kind: "caution",
          text: "If you have diabetes and are fasting under medical advice, guidelines say to break the fast if your blood sugar falls below 3.9 mmol/L (70 mg/dL) or rises above 16.7 mmol/L (300 mg/dL), or if you feel unwell.",
        },
      ],
    },
    {
      heading: "Red flags: stop and eat or drink",
      blocks: [
        {
          kind: "list",
          items: [
            "Dizziness, shakiness, sweating, confusion or blurred vision",
            "Fainting or nearly fainting",
            "A racing or pounding heart, or chest pain (get medical help)",
            "Very dark urine, a headache that won't go, or muscle cramps in the heat",
          ],
        },
        {
          kind: "p",
          text: "Fasts without water in Indian summers are especially risky. Train indoors, keep sessions short, and don't train at all on nirjala days.",
        },
      ],
    },
  ],
  sources: [
    {
      title: "ISSN position stand: diets and body composition (Aragon et al., 2017)",
      url: "https://pubmed.ncbi.nlm.nih.gov/28630601/",
    },
    {
      title: "Moro et al. (2016), Effects of eight weeks of time-restricted feeding (16/8) in resistance-trained males",
      url: "https://pubmed.ncbi.nlm.nih.gov/27737674/",
    },
    {
      title: "ISSN position stand: protein and exercise (Jäger et al., 2017)",
      url: "https://pubmed.ncbi.nlm.nih.gov/28642676/",
    },
    {
      title: "Shephard (2012), The impact of Ramadan observance upon athletic performance (Nutrients)",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3397348/",
    },
    {
      title: "IDF-DAR: Diabetes and Ramadan, practical guidelines",
      url: "https://pubmed.ncbi.nlm.nih.gov/28347497/",
    },
    {
      title: "Mayo Clinic Q&A: Is intermittent fasting good for weight loss?",
      url: "https://newsnetwork.mayoclinic.org/discussion/mayo-clinic-q-and-a-is-intermittent-fasting-good-for-weight-loss/",
    },
  ],
};
