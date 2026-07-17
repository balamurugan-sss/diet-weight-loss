import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Flame, ChefHat, Package, Lightbulb } from "lucide-react";
import { RECIPES } from "@/lib/data/recipes";
import { LogMealButton } from "@/components/meals/LogMealButton";

export async function generateStaticParams() {
  return RECIPES.map((r) => ({ id: r.id }));
}

export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = RECIPES.find((r) => r.id === id);
  if (!recipe) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <Link href="/meals" className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--primary-2)" }}>
        <ArrowLeft size={14} /> Back to meal plan
      </Link>

      <div className="glass-card p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{recipe.name}</h1>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {recipe.tags.map((tag) => (
                <span key={tag} className="chip">{tag}</span>
              ))}
            </div>
          </div>
          <LogMealButton recipe={recipe} />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={Flame} label="Calories" value={`${recipe.calories}`} />
          <Stat label="Protein" value={`${recipe.proteinG}g`} />
          <Stat label="Carbs" value={`${recipe.carbsG}g`} />
          <Stat label="Fat" value={`${recipe.fatG}g`} />
          <Stat label="Fiber" value={`${recipe.fiberG}g`} />
          <Stat label="Serving" value={recipe.servingSize} />
          <Stat icon={Clock} label="Prep + Cook" value={`${recipe.prepTimeMin + recipe.cookTimeMin} min`} />
          <Stat icon={ChefHat} label="Difficulty" value={recipe.difficulty} />
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="mb-3 font-semibold">Ingredients</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {recipe.ingredients.map((ing) => (
            <li key={ing.name} className="solid-card flex items-center justify-between px-3 py-2 text-sm">
              <span>{ing.name}</span>
              <span style={{ color: "var(--muted)" }}>{ing.quantity}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="glass-card p-6">
        <h2 className="mb-3 font-semibold">Cooking Instructions</h2>
        <ol className="flex flex-col gap-3">
          {recipe.instructions.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white gradient-primary">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="glass-card p-6">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Lightbulb size={16} style={{ color: "var(--primary)" }} /> Nutritional Benefits
          </h2>
          <ul className="list-disc space-y-1.5 pl-4 text-sm">
            {recipe.nutritionalBenefits.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
        <div className="glass-card p-6">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Package size={16} style={{ color: "var(--accent-2)" }} /> Storage & Alternatives
          </h2>
          <p className="text-sm">{recipe.storageTips}</p>
          <ul className="mt-3 list-disc space-y-1.5 pl-4 text-sm">
            {recipe.healthyAlternatives.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon?: typeof Flame; label: string; value: string }) {
  return (
    <div className="solid-card p-3">
      <p className="flex items-center gap-1 text-[11px] font-medium" style={{ color: "var(--muted)" }}>
        {Icon && <Icon size={11} />} {label}
      </p>
      <p className="truncate text-sm font-bold">{value}</p>
    </div>
  );
}
