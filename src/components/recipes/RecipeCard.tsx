import { Clock, Flame } from "lucide-react";
import Link from "next/link";
import type { TFunc } from "@/lib/i18n/t";
import type { RecipeCardData } from "@/server/services/recipes";
import { RecipeVisual } from "./RecipeVisual";

export function RecipeCard({ r, t }: { r: RecipeCardData; t: TFunc }) {
  return (
    <Link href={`/recipes/${r.slug}`} className="group block overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <div className="relative">
        <RecipeVisual
          recipeId={r.id}
          palette={r.palette}
          image={r.image}
          alt={r.title}
          className="aspect-[4/3]"
          labels={{ ai: t("recipe.illustration"), photo: t("recipe.verifiedPhoto"), placeholder: t("recipe.illustrationPlaceholder") }}
        />
        <div className="absolute top-2 right-2 flex gap-1">
          {r.isKeto && <span className="rounded-full bg-lime px-2 py-0.5 text-[11px] font-bold text-forest-700">{t("cat.keto")}</span>}
          {r.isHighProtein && <span className="rounded-full bg-forest px-2 py-0.5 text-[11px] font-bold text-white">{t("cat.high_protein")}</span>}
        </div>
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 min-h-[2.6em] leading-snug font-semibold group-hover:text-forest">{r.title}</h3>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[13px] text-muted tabular">
          <span className="inline-flex items-center gap-0.5 font-semibold text-charcoal">
            <Flame className="size-3.5 text-terracotta" aria-hidden /> {Math.round(r.kcal)}
          </span>
          <span>P {Math.round(r.proteinG)}g</span>
          <span>NC {r.netCarbsG}g</span>
          <span className="inline-flex items-center gap-0.5">
            <Clock className="size-3.5" aria-hidden /> {r.prepMin + r.cookMin}′
          </span>
          <span>₹{Math.round(r.costPerServingInr)}</span>
        </p>
      </div>
    </Link>
  );
}
