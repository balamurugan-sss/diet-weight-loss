import type { Guide } from "../types";

export const cardioKickoff: Guide = {
  slug: "cardio-kickoff",
  title: "Cardio Kickoff: A Beginner's Plan",
  category: "trending",
  summary:
    "Start cardio the easy way: how much to do, how hard to go, which activity to pick, a 4-week starter plan, and how to stay safe in Indian heat and pollution.",
  tags: ["CARDIO", "BEGINNER"],
  readMinutes: 4,
  pattern: "march",
  caution:
    "Check with your doctor first if you have heart disease, high blood pressure, diabetes, or lung problems, if you get chest pain, dizziness or unusual breathlessness on mild effort, or if you're pregnant and new to exercise.",
  sections: [
    {
      heading: "How much cardio you need",
      blocks: [
        {
          kind: "p",
          text: "The WHO recommends that adults do 150–300 minutes of moderate aerobic activity a week, or 75–150 minutes of vigorous activity, or a mix of the two. Add muscle-strengthening work on 2 or more days. Some activity is always better than none.",
        },
        {
          kind: "p",
          text: "150 minutes sounds like a lot, but it's 30 minutes on 5 days, and shorter bouts add up. A 10-minute brisk walk after each meal gets you there too.",
        },
      ],
    },
    {
      heading: "How hard: the talk test and heart-rate zones",
      blocks: [
        {
          kind: "list",
          items: [
            "Moderate: you can talk, but you can't sing.",
            "Vigorous: you can only say a few words before you need to pause for breath.",
          ],
        },
        {
          kind: "p",
          text: "Wearing a watch? A rough guide to your maximum heart rate is 220 minus your age. Moderate effort is about 50–70% of that, and vigorous is about 70–85%.",
        },
        {
          kind: "table",
          head: ["Age", "Estimated max (bpm)", "Moderate (bpm)", "Vigorous (bpm)"],
          rows: [
            ["20", "200", "100–140", "140–170"],
            ["30", "190", "95–133", "133–162"],
            ["40", "180", "90–126", "126–153"],
            ["50", "170", "85–119", "119–145"],
            ["60", "160", "80–112", "112–136"],
          ],
        },
        {
          kind: "tip",
          text: "These numbers are averages. Some blood-pressure medicines (such as beta blockers) lower your heart rate. If you take one, go by the talk test and ask your doctor.",
        },
      ],
    },
    {
      heading: "Pick your cardio",
      blocks: [
        {
          kind: "table",
          head: ["Activity", "Good for", "Start with"],
          rows: [
            ["Brisk walking", "Everyone; easiest to start, no equipment", "15–20 minutes at a pace where talking takes a little effort"],
            ["Cycling (outdoor or stationary)", "Easy on the knees; good for heavier bodies", "15–20 minutes on flat roads or light resistance"],
            ["Skipping (rope)", "Small spaces, travel, quick sessions", "Rounds of 30 seconds skipping and 30 seconds rest"],
            ["Swimming or water walking", "Joint pain, hot days", "Short lengths with rests at the wall"],
            ["Dancing, Zumba, garba practice", "Fun and social", "One beginner class or a 20-minute video"],
            ["Stair climbing", "Building leg strength and stamina at home", "A few flights, then walk on the flat to recover"],
          ],
        },
      ],
    },
    {
      heading: "Your 4-week starter plan",
      blocks: [
        {
          kind: "p",
          text: "Pick any activity above (brisk walking is a great default). Keep most sessions at a moderate effort by the talk test. If a week feels too hard, repeat it before moving on.",
        },
        {
          kind: "table",
          head: ["Week", "Sessions", "Each session", "Weekly total"],
          rows: [
            ["1", "5", "20 minutes, easy to moderate", "100 minutes"],
            ["2", "5", "25 minutes, moderate", "125 minutes"],
            ["3", "5", "30 minutes, moderate", "150 minutes: you've hit the WHO minimum"],
            ["4", "5", "4 × 35 minutes moderate + 1 × 20-minute interval session", "160 minutes"],
          ],
        },
        {
          kind: "tip",
          text: "Add 2 short strength sessions a week alongside this. Movewell's home programs fit around these walks.",
        },
      ],
    },
    {
      heading: "HIIT, gently",
      blocks: [
        {
          kind: "p",
          text: "High-intensity interval training (HIIT) alternates short hard bursts with easy recovery. It's time-efficient, but build a base of steady cardio for a few weeks first.",
        },
        {
          kind: "list",
          ordered: true,
          items: [
            "Warm up with 5–10 minutes of easy movement.",
            "Go hard for 30 seconds (fast cycling, fast uphill walking or skipping), at a level where you can only say a few words.",
            "Go easy for 90 seconds.",
            "Repeat 6–8 times, then cool down with easy walking.",
          ],
        },
        {
          kind: "p",
          text: "Once or twice a week is plenty, with an easier day in between. If you have a heart condition, get your doctor's OK before doing HIIT.",
        },
      ],
    },
    {
      heading: "Heat and pollution: training in India",
      blocks: [
        { kind: "h", text: "In the heat" },
        {
          kind: "list",
          items: [
            "Avoid the sun between 12 noon and 3 pm. Train early morning or after sunset.",
            "Drink water regularly, even if you don't feel thirsty. Add buttermilk, lemon water or ORS on very sweaty days.",
            "Wear light, loose, light-coloured cotton or sports fabric, and a cap.",
            "Stop if you feel dizzy, sick, have a headache, extreme thirst, or fast breathing or heartbeat. Move to shade and sip fluids. Call 108 or 102 if someone is confused or has a very high temperature.",
          ],
        },
        { kind: "h", text: "On polluted days" },
        {
          kind: "list",
          items: [
            "Check the air quality index (AQI) on CPCB's Sameer app or a weather app before heading out.",
            "On 'poor' or worse days, move indoors: mall or corridor walking, a stationary bike, skipping, or a home workout video.",
            "Stay away from busy roads; parks and back lanes have less traffic exhaust.",
            "If you have asthma, heart or lung disease, be extra cautious. Stop if you start coughing, wheezing or feel your chest tighten.",
          ],
        },
        {
          kind: "tip",
          text: "Monsoon tip: roads get slippery and waterlogged. Have an indoor backup ready, such as stair climbing or a 20-minute dance or walk-at-home video.",
        },
      ],
    },
    {
      heading: "Stay safe and keep going",
      blocks: [
        {
          kind: "list",
          items: [
            "Wear comfortable, supportive shoes.",
            "Increase time before intensity, and change one thing at a time.",
            "Stop and get medical help for chest pain or pressure, severe breathlessness, fainting, or an irregular heartbeat.",
            "Log your walks or rides so you can see the weekly total climb.",
          ],
        },
      ],
    },
  ],
  sources: [
    { title: "WHO: Physical activity fact sheet", url: "https://www.who.int/news-room/fact-sheets/detail/physical-activity" },
    { title: "CDC: Measuring physical activity intensity", url: "https://www.cdc.gov/physicalactivity/basics/measuring/index.html" },
    {
      title: "American Heart Association: Target heart rates chart",
      url: "https://www.heart.org/en/healthy-living/fitness/fitness-basics/target-heart-rates",
    },
    {
      title: "India Meteorological Department / NDMA: Heat wave do's and don'ts",
      url: "https://www.imdnagpur.gov.in/docs_general/Heat_wave_Dos_and_Donts.pdf",
    },
  ],
};
