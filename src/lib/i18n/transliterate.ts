/**
 * Rule-based transliteration of Tamil and Malayalam script to a readable
 * Latin form (simplified ISO 15919, without diacritics), for users who speak
 * the language but read Latin script more comfortably.
 */

type Table = {
  vowels: Record<string, string>;
  signs: Record<string, string>;
  consonants: Record<string, string>;
  virama: string;
  extra?: Record<string, string>;
};

const TAMIL: Table = {
  vowels: { அ: "a", ஆ: "aa", இ: "i", ஈ: "ee", உ: "u", ஊ: "oo", எ: "e", ஏ: "e", ஐ: "ai", ஒ: "o", ஓ: "o", ஔ: "au", ஃ: "h" },
  signs: { "ா": "aa", "ி": "i", "ீ": "ee", "ு": "u", "ூ": "oo", "ெ": "e", "ே": "e", "ை": "ai", "ொ": "o", "ோ": "o", "ௌ": "au" },
  consonants: {
    க: "k", ங: "ng", ச: "ch", ஞ: "nj", ட: "d", ண: "n", த: "th", ந: "n", ப: "p", ம: "m", ய: "y", ர: "r", ல: "l", வ: "v",
    ழ: "zh", ள: "l", ற: "r", ன: "n", ஜ: "j", ஷ: "sh", ஸ: "s", ஹ: "h",
  },
  virama: "்",
};

const MALAYALAM: Table = {
  vowels: { അ: "a", ആ: "aa", ഇ: "i", ഈ: "ee", ഉ: "u", ഊ: "oo", ഋ: "ru", എ: "e", ഏ: "e", ഐ: "ai", ഒ: "o", ഓ: "o", ഔ: "au" },
  signs: { "ാ": "aa", "ി": "i", "ീ": "ee", "ു": "u", "ൂ": "oo", "ൃ": "ru", "െ": "e", "േ": "e", "ൈ": "ai", "ൊ": "o", "ോ": "o", "ൌ": "au", "ൗ": "au" },
  consonants: {
    ക: "k", ഖ: "kh", ഗ: "g", ഘ: "gh", ങ: "ng", ച: "ch", ഛ: "chh", ജ: "j", ഝ: "jh", ഞ: "nj", ട: "t", ഠ: "th", ഡ: "d", ഢ: "dh",
    ണ: "n", ത: "th", ഥ: "th", ദ: "d", ധ: "dh", ന: "n", പ: "p", ഫ: "ph", ബ: "b", ഭ: "bh", മ: "m", യ: "y", ര: "r", റ: "r",
    ല: "l", ള: "l", ഴ: "zh", വ: "v", ശ: "sh", ഷ: "sh", സ: "s", ഹ: "h",
  },
  virama: "്",
  // Chillu letters are final consonants with no inherent vowel.
  extra: { "ൻ": "n", "ർ": "r", "ൽ": "l", "ൾ": "l", "ൺ": "n", "ൿ": "k", "ം": "m", "ഃ": "h" },
};

function run(text: string, t: Table): string {
  let out = "";
  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const next = chars[i + 1];
    if (t.consonants[c]) {
      let cons = t.consonants[c];
      // Tamil: க/ச/ட/த/ப are voiced between vowels and after nasals; a
      // simple contextual rule gives far more natural readings.
      if (t === TAMIL) cons = tamilVoicing(c, chars, i, cons);
      if (next === t.virama) {
        out += cons;
        i++;
      } else if (next && t.signs[next]) {
        out += cons + t.signs[next];
        i++;
      } else {
        out += cons + "a";
      }
      continue;
    }
    if (t.vowels[c]) {
      out += t.vowels[c];
      continue;
    }
    if (t.extra?.[c]) {
      out += t.extra[c];
      continue;
    }
    if (t.signs[c] || c === t.virama) continue;
    out += c;
  }
  return out;
}

function tamilVoicing(c: string, chars: string[], i: number, base: string) {
  const prev = chars[i - 1];
  const prev2 = chars[i - 2];
  if (c === "ங" && chars[i + 1] === TAMIL.virama && chars[i + 2] === "க") return "n";
  const atStart = i === 0 || /\s/.test(prev ?? " ");
  const geminate = prev === TAMIL.virama && prev2 === c;
  const closesGeminate = chars[i + 1] === TAMIL.virama && chars[i + 2] === c;
  if (atStart || geminate || closesGeminate) return base;
  const afterNasal = prev === TAMIL.virama && ["ங", "ஞ", "ண", "ந", "ம", "ன"].includes(prev2 ?? "");
  const voiced: Record<string, string> = { க: "g", ச: "s", ட: "d", த: "d", ப: "b" };
  if (afterNasal) return voiced[c] === "s" ? "j" : (voiced[c] ?? base);
  if (prev !== TAMIL.virama && voiced[c]) {
    if (c === "க") return "g";
    if (c === "ச") return "s";
    if (c === "ப") return "b";
    if (c === "த") return "dh";
  }
  if (c === "ட") return "t";
  return base;
}

export function transliterate(text: string, lang: string): string {
  if (lang === "ta") return run(text, TAMIL);
  if (lang === "ml") return run(text, MALAYALAM);
  return text;
}

export function hasIndicScript(text: string) {
  return /[஀-௿ഀ-ൿ]/.test(text);
}
