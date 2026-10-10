/**
 * Spoken narration is assembled from validated recipe text plus these
 * templates — the speech engine only reads; it never writes instructions.
 */
type Templates = {
  step: string;
  timer: string;
  temp: string;
  timerDone: string;
  ingredients: string;
  servings: string;
  finished: string;
};

export const NARRATION: Record<"en" | "ta" | "ml", Templates> = {
  en: {
    step: "Step {n} of {total}. {text}",
    timer: "Set a timer for {min} minutes.",
    temp: "The temperature is {t} degrees Celsius.",
    timerDone: "Your {min} minute timer is done.",
    ingredients: "For {servings} servings you will need:",
    servings: "{servings}",
    finished: "All steps are done. Enjoy your meal.",
  },
  ta: {
    step: "படி {n}, மொத்தம் {total}. {text}",
    timer: "{min} நிமிடங்களுக்கு டைமர் வைக்கவும்.",
    temp: "வெப்பநிலை {t} டிகிரி செல்சியஸ்.",
    timerDone: "{min} நிமிட டைமர் முடிந்தது.",
    ingredients: "{servings} பேருக்குத் தேவையான பொருட்கள்:",
    servings: "{servings}",
    finished: "எல்லா படிகளும் முடிந்தன. சுவைத்து மகிழுங்கள்.",
  },
  ml: {
    step: "ഘട്ടം {n}, ആകെ {total}. {text}",
    timer: "{min} മിനിറ്റിന് ടൈമർ വയ്ക്കുക.",
    temp: "താപനില {t} ഡിഗ്രി സെൽഷ്യസ്.",
    timerDone: "{min} മിനിറ്റ് ടൈമർ കഴിഞ്ഞു.",
    ingredients: "{servings} പേർക്ക് ആവശ്യമുള്ള ചേരുവകൾ:",
    servings: "{servings}",
    finished: "എല്ലാ ഘട്ടങ്ങളും കഴിഞ്ഞു. ഭക്ഷണം ആസ്വദിക്കൂ.",
  },
};

const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

export function narrationLang(code: string): "en" | "ta" | "ml" {
  return code === "ta" ? "ta" : code === "ml" ? "ml" : "en";
}

export function stepNarration(
  lang: "en" | "ta" | "ml",
  step: { text: string; timerSec: number | null; tempC: number | null },
  n: number,
  total: number,
) {
  const T = NARRATION[lang];
  const parts = [fill(T.step, { n, total, text: step.text })];
  if (step.tempC && !step.text.includes(String(step.tempC))) parts.push(fill(T.temp, { t: step.tempC }));
  if (step.timerSec) parts.push(fill(T.timer, { min: Math.round(step.timerSec / 60) }));
  return parts.join(" ");
}

export function timerDoneNarration(lang: "en" | "ta" | "ml", sec: number) {
  return fill(NARRATION[lang].timerDone, { min: Math.max(1, Math.round(sec / 60)) });
}

export function ingredientsNarration(lang: "en" | "ta" | "ml", servings: number, items: string[]) {
  return `${fill(NARRATION[lang].ingredients, { servings })} ${items.join(", ")}.`;
}
