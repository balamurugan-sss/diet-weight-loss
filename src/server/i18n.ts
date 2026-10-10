import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { isLangCode, languageInfo, type LangCode } from "@/lib/i18n/languages";
import { messagesFor } from "@/lib/i18n/messages";
import { makeT } from "@/lib/i18n/t";
import { getCurrentUser } from "@/server/auth/dal";

export const LANG_COOKIE = "thali_lang";

export const getLocale = cache(async (): Promise<LangCode> => {
  const current = await getCurrentUser();
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
