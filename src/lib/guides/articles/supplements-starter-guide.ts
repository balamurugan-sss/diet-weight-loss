import type { Guide } from "../types";

export const supplementsStarterGuide: Guide = {
  slug: "supplements-starter-guide",
  title: "Supplements: A Starter Guide",
  category: "trending",
  summary:
    "Which supplements have real evidence, how much to take, who should be careful, and how to buy safely in India. Food comes first, and most products aren't needed.",
  tags: ["NUTRITION", "SUPPLEMENTS"],
  readMinutes: 5,
  pattern: "curl",
  caution:
    "Check with a doctor before starting any supplement if you are pregnant or breastfeeding, under 18, have kidney or liver disease, high blood pressure or a heart condition, or take regular medicines (especially blood thinners).",
  sections: [
    {
      heading: "Food first, then fill gaps",
      blocks: [
        {
          kind: "p",
          text: "Supplements can't make up for too little sleep, a patchy training plan or a poor diet. At best they add a small edge or fill a specific gap. India's 2024 dietary guidelines (ICMR-NIN) advise getting protein from a mix of foods such as dals, milk, curd, eggs, fish and meat, and not relying on protein supplements to build muscle.",
        },
        {
          kind: "p",
          text: "Our take: most people can meet their needs with food. A few products are well studied, are safe for healthy adults, and are worth knowing about if they suit your goals and budget.",
        },
      ],
    },
    {
      heading: "What the evidence says",
      blocks: [
        {
          kind: "table",
          head: ["Supplement", "Evidence", "What it does", "Typical amount", "Notes"],
          rows: [
            [
              "Creatine monohydrate",
              "Strong",
              "More reps and power in short, hard efforts; better gains from strength training",
              "3–5 g a day, any time of day. Optional loading: about 0.3 g per kg a day for 5–7 days",
              "Plain monohydrate is enough. A small gain in water weight is normal.",
            ],
            [
              "Protein powder (whey, or soy/pea blends)",
              "Strong, as a food",
              "Helps you reach your daily protein when meals fall short",
              "Count it within 1.4–2.0 g protein per kg a day in total; 20–40 g per serving",
              "Only useful if food doesn't get you there. Not needed if it does.",
            ],
            [
              "Caffeine",
              "Strong",
              "Improves endurance and power, and makes effort feel easier",
              "3–6 mg per kg, about 60 minutes before training",
              "Chai or coffee works. Higher doses mostly add side effects. Avoid it late in the day.",
            ],
            [
              "Vitamin D",
              "Good, if you are low",
              "Corrects a deficiency, which matters for bones and muscles",
              "Adults 19–70: 600 IU (15 mcg) a day; over 70: 800 IU (20 mcg). Don't go over 4,000 IU (100 mcg) a day unless prescribed",
              "Get a blood test first. Doctors may prescribe higher doses for a short time to treat deficiency.",
            ],
            [
              "Omega-3 (fish or algal oil)",
              "Mixed",
              "May help if you rarely eat fish; benefits for training are unproven",
              "Follow the label",
              "Food first: oily fish like mackerel (bangda) or sardines (mathi). Check with your doctor if you take blood thinners.",
            ],
            [
              "BCAAs, glutamine",
              "Weak",
              "Little extra benefit if you already eat enough protein",
              "—",
              "Spend the money on food protein instead.",
            ],
            [
              "Fat burners, 'test boosters', mass gainers, detox teas",
              "Weak or none",
              "Mostly marketing; gainers are just expensive calories",
              "—",
              "Some are heavy on stimulants. Avoid them.",
            ],
          ],
        },
      ],
    },
    {
      heading: "Working out your dose",
      blocks: [
        {
          kind: "p",
          text: "Several doses are based on body weight. Here's an example for someone who weighs 70 kg:",
        },
        {
          kind: "list",
          items: [
            "Protein: 1.4–2.0 g × 70 kg = about 100–140 g a day in total, from food plus any powder.",
            "Caffeine: 3–6 mg × 70 kg = 210–420 mg. Start at the low end; more isn't better.",
            "Creatine: 3–5 g a day, whatever your weight. Taking it daily matters more than timing.",
          ],
        },
        {
          kind: "tip",
          text: "Try one new product at a time for a few weeks. If you add three things at once, you won't know what's helping or what's upsetting your stomach.",
        },
      ],
    },
    {
      heading: "Safety first",
      blocks: [
        {
          kind: "list",
          items: [
            "Kidney disease: don't take creatine or high-protein supplements unless your doctor agrees. In healthy people, creatine at normal doses has a good safety record.",
            "Pregnancy and breastfeeding: avoid pre-workouts and stimulant blends, and clear every supplement with your doctor.",
            "Caffeine: it can cause jitters, a racing heart, stomach upset and poor sleep. Be careful if you have high blood pressure, anxiety or heart rhythm problems.",
            "Vitamin D: too much over time can raise blood calcium. Stay within the upper limit unless a doctor is treating a deficiency.",
            "Interactions: fish oil with blood thinners, and vitamin D with some medicines (such as steroids or some weight-loss and cholesterol drugs). Tell your doctor and pharmacist what you take.",
            "Under 18: food first. Creatine is only appropriate with proper supervision.",
            "Competing in tested sport? Contaminated products can cause a failed test. Use batch-tested products only.",
          ],
        },
      ],
    },
    {
      heading: "Buying smart in India",
      blocks: [
        {
          kind: "checklist",
          items: [
            "FSSAI licence number printed on the pack (health supplements and nutraceuticals need one)",
            "Bought from the brand's own store or an authorised seller, not a random reseller",
            "Seal intact, and batch number, manufacturing and expiry dates clearly printed",
            "Uses the brand's authenticity check (scratch code or QR) if it offers one",
            "Independent third-party lab testing or batch reports available",
            "Every ingredient and dose listed (no 'proprietary blend' hiding amounts)",
            "No claims to cure, treat or prevent a disease",
            "Compared on price per gram of protein (or per serving), not per tub",
          ],
        },
        {
          kind: "caution",
          text: "Fakes are common for popular whey brands. If the price looks too good, the taste or mixing is off, or the packaging looks different, stop using it and contact the brand.",
        },
      ],
    },
  ],
  sources: [
    {
      title: "ISSN position stand: safety and efficacy of creatine supplementation (Kreider et al., 2017)",
      url: "https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0173-z",
    },
    {
      title: "ISSN position stand: caffeine and exercise performance (Guest et al., 2021)",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7777221/",
    },
    {
      title: "ISSN position stand: protein and exercise (Jäger et al., 2017)",
      url: "https://pubmed.ncbi.nlm.nih.gov/28642676/",
    },
    { title: "NIH Office of Dietary Supplements: Vitamin D fact sheet", url: "https://ods.od.nih.gov/factsheets/VitaminD-Consumer/" },
    {
      title: "ICMR-NIN: Dietary Guidelines for Indians (2024)",
      url: "https://www.nin.res.in/dietaryguidelines/pdfjs/locale/DGI24thJune2024fin.pdf",
    },
    {
      title: "FSSAI: Order on licensing of health supplements and nutraceuticals",
      url: "https://fssai.gov.in/upload/advisories/2021/11/617f7648ce58aOrder_Nutra_License_16_09_2021_Revised_01_11_2021.pdf",
    },
  ],
};
