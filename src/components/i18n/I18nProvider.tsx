"use client";

import { createContext, useContext, useMemo } from "react";
import type { LangCode } from "@/lib/i18n/languages";
import type { Messages } from "@/lib/i18n/messages/en";
import { makeT, type TFunc } from "@/lib/i18n/t";
import { transliterate } from "@/lib/i18n/transliterate";

type Ctx = { lang: LangCode; t: TFunc; transliteration: boolean; tx: (s: string) => string | null };
const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({
  lang,
  messages,
  transliteration,
  children,
}: {
  lang: LangCode;
  messages: Messages;
  transliteration: boolean;
  children: React.ReactNode;
}) {
  const value = useMemo<Ctx>(() => {
    const uiLang = lang === "ta" || lang === "ml" ? lang : null;
    return {
      lang,
      t: makeT(messages),
      transliteration,
      tx: (s: string) => (transliteration && uiLang ? transliterate(s, uiLang) : null),
    };
  }, [lang, messages, transliteration]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

/** Native text with an optional Latin transliteration line beneath it. */
export function Tx({ children, className }: { children: string; className?: string }) {
  const { tx } = useI18n();
  const latin = tx(children);
  return (
    <span className={className}>
      {children}
      {latin && latin !== children && (
        <span className="mt-0.5 block text-[0.8em] font-normal text-muted italic" lang="en">
          {latin}
        </span>
      )}
    </span>
  );
}
