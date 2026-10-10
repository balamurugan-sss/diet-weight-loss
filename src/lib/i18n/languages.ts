/**
 * Language registry. Adding Telugu, Kannada or Hindi means: add an entry here
 * with `uiAvailable: false` until a messages file exists, add
 * `messages/<code>.ts`, and add narration templates in `narration.ts`.
 */
export type LangCode = "en" | "en-IN" | "ta" | "ml" | "te" | "kn" | "hi";

export type LanguageInfo = {
  code: LangCode;
  name: string;
  nativeName: string;
  /** BCP-47 tag used for speech synthesis and the html lang attribute. */
  speechTag: string;
  /** Messages file to use for UI strings. */
  uiLang: "en" | "ta" | "ml";
  /** Recipe translations stored under this code ("en" = original text). */
  contentLang: string;
  script: "latin" | "tamil" | "malayalam" | "telugu" | "kannada" | "devanagari";
  uiAvailable: boolean;
};

export const LANGUAGES: LanguageInfo[] = [
  { code: "en", name: "English", nativeName: "English", speechTag: "en-GB", uiLang: "en", contentLang: "en", script: "latin", uiAvailable: true },
  { code: "en-IN", name: "English (Indian accent)", nativeName: "English (India)", speechTag: "en-IN", uiLang: "en", contentLang: "en", script: "latin", uiAvailable: true },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", speechTag: "ta-IN", uiLang: "ta", contentLang: "ta", script: "tamil", uiAvailable: true },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", speechTag: "ml-IN", uiLang: "ml", contentLang: "ml", script: "malayalam", uiAvailable: true },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", speechTag: "te-IN", uiLang: "en", contentLang: "te", script: "telugu", uiAvailable: false },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", speechTag: "kn-IN", uiLang: "en", contentLang: "kn", script: "kannada", uiAvailable: false },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", speechTag: "hi-IN", uiLang: "en", contentLang: "hi", script: "devanagari", uiAvailable: false },
];

export const AVAILABLE_LANGUAGES = LANGUAGES.filter((l) => l.uiAvailable);

export function languageInfo(code: string | null | undefined): LanguageInfo {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

export function isLangCode(code: unknown): code is LangCode {
  return typeof code === "string" && LANGUAGES.some((l) => l.code === code && l.uiAvailable);
}
