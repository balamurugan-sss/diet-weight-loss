import type { Guide } from "../types";

export const metabolicTypes: Guide = {
  slug: "metabolic-types",
  title: "Metabolic Types: Myth vs What Really Varies",
  category: "trending",
  summary:
    "Fixed 'metabolic types' and body-type diets aren't backed by good evidence. Here's what really differs between people, plus a quick self-check to help you choose an eating style that suits you.",
  tags: ["METABOLISM", "NUTRITION"],
  readMinutes: 5,
  pattern: "plank",
  caution:
    "If you have unexplained weight gain or loss, constant tiredness, irregular periods or other new symptoms, see a doctor. These can be signs of a medical condition that no diet quiz can pick up.",
  sections: [
    {
      heading: "The honest answer",
      blocks: [
        {
          kind: "p",
          text: "'Metabolic typing' (being a 'protein type', 'carb type' or 'mixed type') and body-type diets (ectomorph, mesomorph, endomorph) are popular online. But no validated test sorts people into fixed types, and there is no good trial evidence that eating 'for your type' works better.",
        },
        {
          kind: "p",
          text: "When scientists have tested the idea directly, it hasn't held up. In the DIETFITS trial, 609 adults followed either a healthy low-fat or a healthy low-carb diet for a year. Both groups lost a similar amount of weight (about 5–6 kg on average). Neither a genetic test nor a measure of insulin response predicted who would do better on which diet.",
        },
        {
          kind: "p",
          text: "Reviews reach the same conclusion: many different eating patterns, from low-fat to low-carb, work about equally well for body composition when calories and protein are similar. The best diet is the one you can stick to.",
        },
      ],
    },
    {
      heading: "What really varies between people",
      blocks: [
        {
          kind: "list",
          items: [
            "Body size and muscle: bigger bodies and more muscle burn more energy. This explains most of the difference in metabolism between people.",
            "Age, less than you'd think: in a large study, energy use (adjusted for body size and muscle) stayed steady from about 20 to 60 years and only declined after that. A 'slower metabolism at 35' is usually less movement and less muscle, not a broken metabolism.",
            "Everyday movement (NEAT): walking, standing, chores, fidgeting. Between people of similar size it can differ by up to 2,000 kcal a day, which is far more than most workouts burn.",
            "Sleep and stress: short sleep raises hunger and makes food choices harder.",
            "How you respond to carbs: activity, muscle mass and body fat all affect how well your body handles sugar. This can change, and it improves with exercise.",
            "Appetite, preferences and schedule: some people feel best on three meals, others on smaller, more frequent ones.",
            "Medical conditions and medicines: an underactive thyroid can cause tiredness, weight gain and feeling cold. PCOS can cause irregular periods, excess hair and weight gain, and is linked to insulin resistance. Some medicines, such as steroids and some antidepressants, can also affect weight.",
          ],
        },
      ],
    },
    {
      heading: "A practical self-check (not a diagnosis)",
      blocks: [
        {
          kind: "p",
          text: "This quiz can't measure your metabolism. It looks at your habits and how meals make you feel, so you can choose a practical starting point. Pick the answer that fits you best most days.",
        },
        {
          kind: "quiz",
          id: "eating-style",
          questions: [
            {
              q: "How do you usually feel 2 hours after a big rice or roti meal?",
              options: [
                { label: "Fine and steady until the next meal", outcome: "steady" },
                { label: "Sleepy, sluggish or hungry again quite soon", outcome: "carbSensitive" },
                { label: "I rarely eat a proper meal; I pick at things", outcome: "grazer" },
              ],
            },
            {
              q: "What does a typical workday of eating look like?",
              options: [
                { label: "Regular breakfast, lunch and dinner", outcome: "steady" },
                { label: "Meals, but they're heavy on rice, roti, bread or sweets", outcome: "carbSensitive" },
                { label: "Skipped meals, then biscuits, namkeen and chai on the go", outcome: "grazer" },
              ],
            },
            {
              q: "When do cravings hit hardest?",
              options: [
                { label: "Not often; mostly when a meal is late", outcome: "steady" },
                { label: "Mid-afternoon or after dinner, for something sweet", outcome: "carbSensitive" },
                { label: "All day; I snack when I'm bored or busy", outcome: "grazer" },
              ],
            },
            {
              q: "How regular is your daily schedule?",
              options: [
                { label: "Fairly predictable", outcome: "steady" },
                { label: "Predictable, but I sit most of the day", outcome: "carbSensitive" },
                { label: "Unpredictable: shifts, travel, meetings or kids", outcome: "grazer" },
              ],
            },
            {
              q: "Which sounds most like you after a sweet or fried snack?",
              options: [
                { label: "No big change", outcome: "steady" },
                { label: "A quick lift, then a slump", outcome: "carbSensitive" },
                { label: "I don't notice, because I'm eating something every hour anyway", outcome: "grazer" },
              ],
            },
            {
              q: "What would help you most right now?",
              options: [
                { label: "Fine-tuning a routine that mostly works", outcome: "steady" },
                { label: "Meals that keep me full and alert", outcome: "carbSensitive" },
                { label: "Some structure that fits a busy day", outcome: "grazer" },
              ],
            },
          ],
          outcomes: {
            steady: {
              title: "Steady fuel",
              text: "Regular meals suit you. Keep three balanced meals: half the plate vegetables, a quarter protein (dal, paneer, eggs, fish, chicken) and a quarter grains or millets. Adjust portions to your goal rather than changing everything. Exercise: 2–3 strength sessions a week plus brisk walks most days, and add a little load or a few reps over time.",
            },
            carbSensitive: {
              title: "Carb-sensitive feel",
              text: "Big carb-heavy meals seem to leave you sleepy or hungry soon after. This is a feeling, not a diagnosis. Try pairing carbs with protein and fibre (dal with rice, curd on the side, salad or sabzi first), choose whole grains and millets like jowar, bajra and ragi, keep rice and roti portions moderate, and take a 10–15 minute walk after meals. Exercise: strength training 2–3 times a week helps your muscles use sugar. If you have a family history of diabetes or signs of PCOS, ask your doctor about a blood sugar test.",
            },
            grazer: {
              title: "Busy grazer",
              text: "Your eating follows your schedule, not your hunger. Set 2–3 anchor meals you rarely skip, and plan protein-rich snacks so packaged ones aren't your only option: roasted chana, sprouts chaat, curd, boiled eggs, fruit with peanuts. Batch-cook on weekends and set a phone reminder for lunch. Exercise: build in everyday movement with walking calls, stairs and a 10-minute walk after meals, plus two short strength sessions a week at home.",
            },
          },
        },
        {
          kind: "caution",
          text: "Your result describes habits, not your body's chemistry. It doesn't tell you whether you have insulin resistance, a thyroid problem or anything else. Only a doctor and proper tests can.",
        },
      ],
    },
    {
      heading: "When to get checked",
      blocks: [
        {
          kind: "list",
          items: [
            "Weight changing without a change in eating or activity",
            "Tiredness, feeling cold, constipation or dry skin (possible thyroid problem)",
            "Irregular or missed periods, acne, or extra facial or body hair (possible PCOS)",
            "Strong thirst, passing urine often, or a family history of diabetes",
          ],
        },
      ],
    },
    {
      heading: "What works for almost everyone",
      blocks: [
        {
          kind: "list",
          items: [
            "Enough protein at each meal",
            "Plenty of vegetables, dals and whole grains for fibre",
            "Fewer sugary drinks, fried snacks and sweets",
            "Strength training to build or keep muscle",
            "More daily movement, not just workouts",
            "7+ hours of sleep",
            "A pattern you enjoy and can keep up",
          ],
        },
      ],
    },
  ],
  sources: [
    {
      title: "Gardner et al. (2018), DIETFITS randomized clinical trial (JAMA)",
      url: "https://pubmed.ncbi.nlm.nih.gov/29466592/",
    },
    {
      title: "ISSN position stand: diets and body composition (Aragon et al., 2017)",
      url: "https://pubmed.ncbi.nlm.nih.gov/28630601/",
    },
    {
      title: "Pontzer et al. (2021), Daily energy expenditure through the human life course (Science)",
      url: "https://pubmed.ncbi.nlm.nih.gov/34385400/",
    },
    {
      title: "Levine et al. (2006), Non-exercise activity thermogenesis (Arterioscler Thromb Vasc Biol)",
      url: "https://pubmed.ncbi.nlm.nih.gov/16439708/",
    },
    { title: "NHS: Underactive thyroid (hypothyroidism)", url: "https://www.nhs.uk/conditions/underactive-thyroid-hypothyroidism/" },
    { title: "NHS: Polycystic ovary syndrome (PCOS)", url: "https://www.nhs.uk/conditions/polycystic-ovary-syndrome-pcos/" },
  ],
};
