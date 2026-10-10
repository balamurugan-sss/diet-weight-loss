"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { AVAILABLE_LANGUAGES, type LangCode } from "@/lib/i18n/languages";
import { setLanguage } from "@/server/actions/auth";

export function LanguageSwitcher({ current, label }: { current: LangCode; label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <label className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-3 text-sm font-medium">
      <Languages className="size-4 text-forest" aria-hidden />
      <span className="sr-only">{label}</span>
      <select
        value={current}
        disabled={pending}
        onChange={(e) =>
          start(async () => {
            await setLanguage(e.target.value);
            router.refresh();
          })
        }
        className="bg-transparent outline-none"
      >
        {AVAILABLE_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code as LangCode}>
            {l.nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}
