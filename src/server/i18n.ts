import "server-only";
import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { cache } from "react";
import { isLangCode, languageInfo, type LangCode } from "@/lib/i18n/languages";
import { messagesFor } from "@/lib/i18n/messages";
import { makeT } from "@/lib/i18n/t";
import { getCurrentUser } from "@/server/auth/dal";

export const LANG_COOKIE = "thali_lang";

/**
 * The root layout needs the language, so a database outage here would take down
 * every page with Next's bare error screen. Fall back to the cookie instead and
 * let the page's own error boundary explain the problem.
 */
async function currentUserOrNull() {
  try {
    return await getCurrentUser();
  } catch (e) {
    unstable_rethrow(e);
    console.error("[i18n] could not load the user; falling back to the language cookie:", e);
    return null;
  }
}

export const getLocale = cache(async (): Promise<LangCode> => {
  const current = await currentUserOrNull();
  const fromProfile = current?.profile?.language;
  if (isLangCode(fromProfile)) return fromProfile;
  const fromCookie = (await cookies()).get(LANG_COOKIE)?.value;
  return isLangCode(fromCookie) ? fromCookie : "en";
});

export const getI18n = cache(async () => {
  const lang = await getLocale();
  const info = languageInfo(lang);
  const messages = messagesFor(info.uiLang);
  const current = await getCurrentUser();
  return { lang, info, messages, t: makeT(messages), transliteration: !!current?.profile?.transliteration };
});
