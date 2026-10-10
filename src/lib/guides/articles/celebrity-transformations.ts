import type { Guide } from "../types";

export const celebrityTransformations: Guide = {
  slug: "celebrity-transformations",
  title: "Celebrity Transformations: What's Real",
  category: "trending",
  summary:
    "How film-star body transformations are really achieved, from months of full-time prep to shoot-day tricks and sometimes drugs, and which parts you can actually use.",
  tags: ["MINDSET", "FAT LOSS"],
  readMinutes: 3,
  pattern: "pushup",
  caution:
    "Never use anabolic steroids, SARMs, diuretics or water-cutting to change how you look. If you're struggling with body image or food, talk to a doctor or counsellor.",
  sections: [
    {
      heading: "The 'before and after' you see",
      blocks: [
        {
          kind: "p",
          text: "A star reveals a shredded body for a role and the internet calls it a 'three-month transformation'. What you don't see is the setup: months of preparation, often years of training beforehand, a team of professionals, and a job that literally pays them to look this way.",
        },
        {
          kind: "p",
          text: "This guide talks about how these transformations generally work. It isn't about any particular person.",
        },
      ],
    },
    {
      heading: "What's really behind it",
      blocks: [
        {
          kind: "list",
          items: [
            "Time: training and dieting can be a full-time job for months, with shooting schedules planned around it.",
            "A team: personal trainers, nutritionists, a personal chef, physiotherapists and sometimes doctors.",
            "Strict, measured food: every meal is weighed, cooked and delivered. There's no office canteen, no wedding buffet and no late-night food delivery.",
            "Training history: many have trained for years. Regaining muscle you once had is much faster than building it for the first time.",
            "Genetics: some people simply carry muscle and lose fat more easily.",
            "Money and recovery: massages, physio, perfect sleep schedules and no long commute.",
          ],
        },
      ],
    },
    {
      heading: "Shoot-day tricks",
      blocks: [
        {
          kind: "p",
          text: "The leanest-looking shot often reflects a few hours, not a lifestyle. Common tricks include:",
        },
        {
          kind: "list",
          items: [
            "Water and salt manipulation in the days before, to look 'drier'",
            "Carb loading and a 'pump' (push-ups or band work right before the camera rolls)",
            "Lighting from above or the side to deepen the shadows around muscles",
            "Body oil, spray tan, make-up contouring, flexing, posing and the best angle",
            "Editing and retouching afterwards",
          ],
        },
        {
          kind: "caution",
          text: "Dehydration and electrolyte manipulation can be dangerous, and research on physique athletes suggests they may not even improve appearance. Don't copy them.",
        },
      ],
    },
    {
      heading: "The part nobody advertises: drugs",
      blocks: [
        {
          kind: "p",
          text: "Some dramatic transformations, in films and on social media, involve performance-enhancing drugs: anabolic steroids, SARMs, growth hormone, thyroid hormone, diuretics or strong stimulants. These are rarely mentioned. We won't guess who uses what, but you should know the risks:",
        },
        {
          kind: "list",
          items: [
            "Heart: an enlarged heart, high blood pressure and harmful cholesterol changes that raise the risk of heart attack and stroke, even in young people",
            "Liver: serious liver damage and tumours, especially with oral steroids",
            "Hormones: shrunken testicles, lower sperm count and breast growth in men; a deeper voice, facial hair and period changes in women",
            "Mind: mood swings, aggression and dependence",
            "Infections such as HIV and hepatitis from shared needles",
          ],
        },
        {
          kind: "p",
          text: "Even 'supplements' can be a risk. Some bodybuilding products sold online have been found to contain hidden steroids or steroid-like ingredients, linked to serious liver injury. SARMs are unapproved drugs linked to liver damage, heart attack and stroke.",
        },
      ],
    },
    {
      heading: "Red flags in transformation marketing",
      blocks: [
        {
          kind: "list",
          items: [
            "Promises of dramatic fat loss in a few weeks",
            "'Before' photos with slouching and flat light, and 'after' photos with a pump, a tan and good lighting",
            "'No diet, no gym' claims",
            "The person selling the plan is also selling a supplement",
            "Secret formulas, 'celebrity diets' or anything that sounds too easy",
          ],
        },
      ],
    },
    {
      heading: "What you can actually use",
      blocks: [
        {
          kind: "table",
          head: ["What they have", "Your version"],
          rows: [
            ["Personal chef", "Batch-cook protein and vegetables twice a week; keep easy protein (curd, eggs, paneer, roasted chana) at hand"],
            ["Personal trainer", "A structured plan with progressive overload, like the Movewell programs, with every set logged"],
            ["Strict prep diet", "A modest deficit, losing about 0.5–1% of body weight a week"],
            ["Nutritionist's macros", "Protein of about 1.6 g per kg a day or a bit more, plus plenty of vegetables and fibre"],
            ["Months of full-time focus", "Think in months, not weeks. Consistency beats intensity."],
            ["Shoot-day tricks", "Skip them. Take progress photos in the same light, at the same time of day."],
            ["Drugs", "Never. No look is worth your heart or liver."],
          ],
        },
        {
          kind: "tip",
          text: "Compare yourself with your own photos from 3 months ago, not with a star's best-lit frame on their best day.",
        },
      ],
    },
  ],
  sources: [
    {
      title: "Helms et al. (2014), Evidence-based recommendations for natural bodybuilding contest preparation: nutrition and supplementation (JISSN)",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4033492/",
    },
    {
      title: "NIDA: Steroids and other appearance and performance enhancing drugs (research report)",
      url: "https://nida.nih.gov/sites/default/files/815-steroids-and-other-appearance-and-performance-enhancing-drugs-apeds.pdf",
    },
    {
      title: "US FDA: Certain bodybuilding products put consumers at risk of heart attack, stroke, serious liver damage and more",
      url: "https://www.fda.gov/drugs/fraudulent-products/certain-bodybuilding-products-put-consumers-risk-heart-attack-stroke-serious-liver-damage-and-more",
    },
    {
      title: "Morton et al. (2018), Protein supplementation and resistance training: meta-analysis (Br J Sports Med)",
      url: "https://pubmed.ncbi.nlm.nih.gov/28698222/",
    },
  ],
};
