import { en, type Messages } from "./en";
import { ml } from "./ml";
import { ta } from "./ta";

/** UI strings for a language, falling back to English for any missing key. */
export function messagesFor(uiLang: "en" | "ta" | "ml"): Messages {
  if (uiLang === "ta") return { ...en, ...ta };
  if (uiLang === "ml") return { ...en, ...ml };
  return en;
}
