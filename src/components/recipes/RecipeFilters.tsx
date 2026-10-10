"use client";

import { SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Sheet } from "@/components/ui/Sheet";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { ALLERGENS, CUISINES } from "@/lib/recipes/types";

const OPTIONS = {
  diet: ["vegan", "vegetarian", "eggitarian", "non_vegetarian"],
  meal: ["breakfast", "lunch", "dinner", "snack", "dessert"],
  maxTime: ["15", "30", "45", "60"],
  maxNet: ["5", "10", "20", "30"],
  minProtein: ["10", "20", "30"],
  sort: ["relevance", "quick", "protein", "lowcarb", "cheap"],
};

export function RecipeFilters() {
  const { t } = useI18n();
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const active = ["diet", "meal", "cuisine", "maxTime", "maxNet", "minProtein", "noAllergens"].filter((k) => sp.get(k)).length;

  const openSheet = () => {
    setDraft(Object.fromEntries(sp.entries()));
    setOpen(true);
  };
  const set = (k: string, v: string) => setDraft((d) => ({ ...d, [k]: d[k] === v ? "" : v }));
  const toggleList = (k: string, v: string) =>
    setDraft((d) => {
      const list = (d[k] ?? "").split(",").filter(Boolean);
      return { ...d, [k]: (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]).join(",") };
    });
  const apply = () => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(draft)) if (v && k !== "page") next.set(k, v);
    router.push(`${path}?${next.toString()}`);
    setOpen(false);
  };
  const label = (k: string, v: string): string => {
    if (k === "diet") return t(`diet.${v}` as MessageKey);
    if (k === "meal") return t(v === "snack" ? "cat.snacks" : v === "dessert" ? "cat.dessert" : (`slot.${v}` as MessageKey));
    if (k === "maxTime") return `≤ ${v} ${t("common.min")}`;
    if (k === "maxNet") return `≤ ${v} g`;
    if (k === "minProtein") return `≥ ${v} g`;
    if (k === "sort") return t(`recipes.sort.${v}` as MessageKey);
    return v;
  };
  const group = (k: keyof typeof OPTIONS, title: MessageKey) => (
    <fieldset className="mb-5">
      <legend className="mb-2 text-sm font-semibold text-ink-2">{t(title)}</legend>
      <div className="flex flex-wrap gap-2">
        {OPTIONS[k].map((v) => (
          <Chip key={v} selected={(draft[k] || (k === "sort" ? "relevance" : "")) === v} onClick={() => set(k, v)}>
            {label(k, v)}
          </Chip>
        ))}
      </div>
    </fieldset>
  );

  return (
    <>
      <Button variant="outline" onClick={openSheet} aria-haspopup="dialog">
        <SlidersHorizontal className="size-4" aria-hidden /> {t("recipes.filters")}
        {active > 0 && <span className="grid size-5 place-items-center rounded-full bg-forest text-[11px] text-on-accent">{active}</span>}
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title={t("recipes.filters")} closeLabel={t("common.close")}>
        {group("sort", "recipes.sort")}
        {group("diet", "recipes.diet")}
        {group("meal", "recipes.mealType")}
        {group("maxTime", "recipes.maxTime")}
        {group("maxNet", "recipes.maxNetCarbs")}
        {group("minProtein", "recipes.minProtein")}
        <fieldset className="mb-5">
          <legend className="mb-2 text-sm font-semibold text-ink-2">{t("recipes.cuisine")}</legend>
          <div className="flex flex-wrap gap-2">
            {CUISINES.map((c) => (
              <Chip key={c} selected={draft.cuisine === c} onClick={() => set("cuisine", c)}>
                {t(`cuisine.${c}`)}
              </Chip>
            ))}
          </div>
        </fieldset>
        <fieldset className="mb-6">
          <legend className="mb-2 text-sm font-semibold text-ink-2">{t("recipes.excludeAllergens")}</legend>
          <div className="flex flex-wrap gap-2">
            {ALLERGENS.map((a) => (
              <Chip key={a} selected={(draft.noAllergens ?? "").split(",").includes(a)} onClick={() => toggleList("noAllergens", a)}>
                {t(`allergen.${a}`)}
              </Chip>
            ))}
          </div>
        </fieldset>
        <div className="sticky bottom-0 flex gap-2 bg-surface pt-2">
          <Button variant="ghost" onClick={() => setDraft({ q: draft.q ?? "", tab: draft.tab ?? "" })}>
            {t("recipes.clear")}
          </Button>
          <Button className="flex-1" onClick={apply}>
            {t("common.done")}
          </Button>
        </div>
      </Sheet>
    </>
  );
}
