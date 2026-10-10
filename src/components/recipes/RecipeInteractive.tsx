"use client";

import { Bookmark, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { UnitSystem } from "@/lib/recipes/measures";
import { savePreferences } from "@/server/actions/profile";
import { recordViewAction, toggleFavouriteAction } from "@/server/actions/recipes";
import { IngredientList, type IngredientLineView } from "./IngredientList";

export function FavouriteButton({ recipeId, initial, compact = false }: { recipeId: string; initial: boolean; compact?: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [fav, setFav] = useState(initial);
  const [pending, start] = useTransition();
  useEffect(() => {
    void recordViewAction(recipeId);
  }, [recipeId]);
  const toggle = () =>
    start(async () => {
      const r = await toggleFavouriteAction(recipeId);
      if (r.ok) setFav(r.favourite);
      router.refresh();
    });
  if (compact)
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={fav}
        aria-label={fav ? t("recipe.favourited") : t("recipe.favourite")}
        className={cn("grid size-11 place-items-center rounded-full shadow-lg", fav ? "bg-lime text-[#0c0c0b]" : "bg-[#0c0c0b] text-[#f4f4ee]")}
      >
        <Bookmark className={cn("size-5", fav && "fill-current")} />
      </button>
    );
  return (
    <Button
      variant={fav ? "secondary" : "outline"}
      size="lg"
      aria-pressed={fav}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await toggleFavouriteAction(recipeId);
          if (r.ok) setFav(r.favourite);
          router.refresh();
        })
      }
    >
      <Heart className={cn("size-5", fav && "fill-terracotta text-terracotta")} aria-hidden /> {fav ? t("recipe.favourited") : t("recipe.favourite")}
    </Button>
  );
}

export function RecipeIngredients({ lines, servings, units }: { lines: IngredientLineView[]; servings: number; units: UnitSystem }) {
  const [n, setN] = useState(servings);
  const [u, setU] = useState<UnitSystem>(units);
  return (
    <IngredientList
      lines={lines}
      baseServings={servings}
      servings={n}
      onServings={setN}
      units={u}
      onUnits={(v) => {
        setU(v);
        void savePreferences({ units: v });
      }}
    />
  );
}
