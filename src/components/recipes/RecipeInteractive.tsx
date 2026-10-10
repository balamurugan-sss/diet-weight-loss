"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { UnitSystem } from "@/lib/recipes/measures";
import { savePreferences } from "@/server/actions/profile";
import { recordViewAction, toggleFavouriteAction } from "@/server/actions/recipes";
import { IngredientList, type IngredientLineView } from "./IngredientList";

export function FavouriteButton({ recipeId, initial }: { recipeId: string; initial: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const [fav, setFav] = useState(initial);
  const [pending, start] = useTransition();
  useEffect(() => {
    void recordViewAction(recipeId);
  }, [recipeId]);
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
