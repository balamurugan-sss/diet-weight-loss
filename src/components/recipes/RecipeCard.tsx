import { Clock, Flame } from "lucide-react";
import Link from "next/link";
import { ArrowCircle } from "@/components/brand/Brand";
import { cn } from "@/lib/cn";
import type { TFunc } from "@/lib/i18n/t";
import type { RecipeCardData } from "@/server/services/recipes";
import { RecipeVisual } from "./RecipeVisual";

/** Reference-style tile: image on top, bold title, stats, ↗ button. `featured` uses the pale-lime card. */
export function RecipeCard({ r, t, featured = false }: { r: RecipeCardData; t: TFunc; featured?: boolean }) {
  return (
    <Link
      href={`/recipes/${r.slug}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] p-1.5 transition-transform hover:-translate-y-0.5",
        featured ? "card-lime" : "card",
      )}
    >
      <div className="relative">
        <RecipeVisual
          recipeId={r.id}
          palette={r.palette}
          image={r.image}
          alt={r.title}
          className="aspect-[4/3.4] rounded-[1.15rem]"
          labels={{ ai: t("recipe.illustration"), photo: t("recipe.verifiedPhoto"), placeholder: t("recipe.illustrationPlaceholder") }}
        />
        <div className="absolute top-2 right-2 flex gap-1">
          {r.isKeto && <span className="rounded-full bg-lime px-2 py-0.5 text-[11px] font-bold text-white">{t("cat.keto")}</span>}
          {r.isHighProtein && <span className="rounded-full bg-[#0a0c0e] px-2 py-0.5 text-[11px] font-bold text-lime">{t("cat.high_protein")}</span>}
        </div>
      </div>
      <div className="flex flex-1 items-end gap-2 px-2 pt-2.5 pb-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-display line-clamp-2 text-[15px] leading-snug font-bold">{r.title}</h3>
          <p className={cn("mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] tabular", featured ? "text-white/70" : "text-muted")}>
            <span className={cn("inline-flex items-center gap-0.5 font-semibold", featured ? "text-white" : "text-charcoal")}>
              <Flame className="size-3.5" aria-hidden /> {Math.round(r.kcal)}
            </span>
            <span>P {Math.round(r.proteinG)}g</span>
            <span>NC {r.netCarbsG}g</span>
            <span className="inline-flex items-center gap-0.5">
              <Clock className="size-3" aria-hidden /> {r.prepMin + r.cookMin}′
            </span>
            <span>₹{Math.round(r.costPerServingInr)}</span>
          </p>
        </div>
        <ArrowCircle dark={featured} className="size-9 transition-transform group-hover:rotate-45" />
      </div>
    </Link>
  );
}
