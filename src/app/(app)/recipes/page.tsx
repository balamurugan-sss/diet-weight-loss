import { Search } from "lucide-react";
import Link from "next/link";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { RecipeFilters } from "@/components/recipes/RecipeFilters";
import { buttonClass } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";
import { searchRecipes, type RecipeFilters as F } from "@/server/services/recipes";

export const metadata = { title: "Recipes" };

const CATEGORIES = [
  "indian_keto", "south_indian_low_carb", "high_protein", "vegetarian", "egg", "chicken_meat", "fish_seafood", "breakfast",
  "lunch_dinner", "snacks", "soups_salads", "dessert", "quick_15", "budget", "family", "meal_prep",
];

const num = (v: unknown) => (typeof v === "string" && /^\d+$/.test(v) ? Number(v) : undefined);
const str = (v: unknown) => (typeof v === "string" && v.length < 100 ? v : undefined);

export default async function RecipesPage({ searchParams }: PageProps<"/recipes">) {
  const { user, profile } = await requireOnboarded();
  const { t } = await getI18n();
  const sp = await searchParams;
  const tab = (["favourites", "recent"].includes(String(sp.tab)) ? sp.tab : "all") as F["tab"];
  const forMe = sp.forMe !== "0";
  const filters: F = {
    q: str(sp.q),
    cat: str(sp.cat),
    diet: str(sp.diet),
    meal: str(sp.meal),
    cuisine: str(sp.cuisine),
    maxTime: num(sp.maxTime),
    maxNet: num(sp.maxNet),
    minProtein: num(sp.minProtein),
    noAllergens: str(sp.noAllergens)?.split(",").filter(Boolean),
    sort: str(sp.sort) as F["sort"],
    page: num(sp.page),
    tab,
    forMe,
  };
  const res = await searchRecipes(user.id, profile, filters);
  const href = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && v) next.set(k, v);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!("page" in patch)) next.delete("page");
    const qs = next.toString();
    return `/recipes${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t("recipes.title")} subtitle={t("recipes.results", { n: res.total })} />
      <div className="flex gap-2">
        <form action="/recipes" className="relative flex-1" role="search">
          {filters.cat && <input type="hidden" name="cat" value={filters.cat} />}
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" aria-hidden />
          <input
            name="q"
            defaultValue={filters.q}
            placeholder={t("recipes.search")}
            aria-label={t("recipes.search")}
            className="h-12 w-full rounded-2xl border border-line bg-surface pr-4 pl-12 text-base outline-none focus:border-forest focus:ring-2 focus:ring-forest/15"
          />
        </form>
        <RecipeFilters />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["all", "favourites", "recent"] as const).map((tb) => (
          <Link key={tb} href={href({ tab: tb === "all" ? undefined : tb })} className={buttonClass(tab === tb ? "primary" : "outline", "sm")} aria-current={tab === tb ? "page" : undefined}>
            {t(tb === "all" ? "recipes.all" : tb === "favourites" ? "recipes.favourites" : "recipes.recent")}
          </Link>
        ))}
        <Link href={href({ forMe: forMe ? "0" : undefined })} className={cn("ml-auto inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold", forMe ? "bg-lime-100 text-forest-700" : "text-muted")} aria-pressed={forMe}>
          <span className={cn("relative h-5 w-9 rounded-full transition-colors", forMe ? "bg-forest" : "bg-sand-2")} aria-hidden>
            <span className={cn("absolute top-0.5 size-4 rounded-full bg-white transition-all", forMe ? "left-4.5" : "left-0.5")} />
          </span>
          {t("diet." + (profile.dietPreference ?? "vegetarian") as MessageKey)}
        </Link>
      </div>

      <nav aria-label={t("recipes.filters")} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {CATEGORIES.map((c) => {
          const on = filters.cat === c;
          return (
            <Link key={c} href={href({ cat: on ? undefined : c })} className={cn("shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium", on ? "border-forest bg-forest text-on-accent" : "border-line bg-surface hover:border-forest/40")}>
              {t(`cat.${c}` as MessageKey)}
            </Link>
          );
        })}
      </nav>

      {res.recipes.length === 0 ? (
        <p className="card-sand py-14 text-center text-muted">{t("recipes.noResults")}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {res.recipes.map((r, i) => (
            <li key={r.id}>
              <RecipeCard r={r} t={t} featured={i % 4 === 0 || i % 4 === 3} />
            </li>
          ))}
        </ul>
      )}

      {res.pages > 1 && (
        <nav className="flex items-center justify-between pt-2" aria-label="Pagination">
          <Link aria-disabled={res.page <= 1} href={href({ page: String(res.page - 1) })} className={buttonClass("outline", "sm", res.page <= 1 ? "pointer-events-none opacity-40" : "")}>
            {t("recipes.prev")}
          </Link>
          <span className="text-sm text-muted">{t("recipes.page", { n: res.page, total: res.pages })}</span>
          <Link aria-disabled={res.page >= res.pages} href={href({ page: String(res.page + 1) })} className={buttonClass("outline", "sm", res.page >= res.pages ? "pointer-events-none opacity-40" : "")}>
            {t("recipes.next")}
          </Link>
        </nav>
      )}
    </div>
  );
}
