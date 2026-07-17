"use client";

import { useState } from "react";
import { Sparkles, X, Plus } from "lucide-react";
import type { MealSlot, MealTag, Recipe } from "@/types";
import { generateRecipeSuggestions } from "@/lib/ai/recipeGenerator";
import { MealCard } from "@/components/meals/MealCard";
import { cn } from "@/lib/utils";

const SLOT_OPTIONS: { value: MealSlot; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "morningSnack", label: "Snack" },
];

const TAG_OPTIONS: { value: MealTag; label: string }[] = [
  { value: "high-protein", label: "High Protein" },
  { value: "low-carb", label: "Low Carb" },
  { value: "low-fat", label: "Low Fat" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "budget", label: "Budget Meals" },
  { value: "indian", label: "Indian Meals" },
];

export default function RecipeGeneratorPage() {
  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [slot, setSlot] = useState<MealSlot | undefined>(undefined);
  const [tags, setTags] = useState<MealTag[]>([]);
  const [results, setResults] = useState<Recipe[] | null>(null);

  function addIngredient() {
    const value = ingredientInput.trim();
    if (value && !ingredients.includes(value)) {
      setIngredients([...ingredients, value]);
    }
    setIngredientInput("");
  }

  function toggleTag(tag: MealTag) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function generate() {
    setResults(generateRecipeSuggestions({ ingredients, slot, tags }));
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold">AI Recipe Generator</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Tell us what you have and what you want — we&apos;ll match recipes from our database.
        </p>
      </div>

      <div className="glass-card p-6">
        <label className="mb-2 block text-sm font-medium">Ingredients you have</label>
        <div className="flex gap-2">
          <input
            className="input-field"
            placeholder="e.g. Chicken, Rice, Egg, Tomato"
            value={ingredientInput}
            onChange={(e) => setIngredientInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addIngredient();
              }
            }}
          />
          <button onClick={addIngredient} className="btn-secondary !px-4">
            <Plus size={16} />
          </button>
        </div>
        {ingredients.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {ingredients.map((ing) => (
              <span key={ing} className="chip chip-active">
                {ing}
                <button onClick={() => setIngredients(ingredients.filter((i) => i !== ing))}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        <label className="mb-2 mt-5 block text-sm font-medium">Meal Type</label>
        <div className="flex flex-wrap gap-2">
          {SLOT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSlot(slot === opt.value ? undefined : opt.value)}
              className={cn("chip", slot === opt.value && "chip-active")}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <label className="mb-2 mt-5 block text-sm font-medium">Filters</label>
        <div className="flex flex-wrap gap-2">
          {TAG_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => toggleTag(opt.value)}
              className={cn("chip", tags.includes(opt.value) && "chip-active")}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button onClick={generate} className="btn-primary mt-6 w-full">
          <Sparkles size={16} /> Generate Recipes
        </button>
      </div>

      {results && (
        <div className="glass-card p-6">
          <h2 className="mb-4 font-semibold">
            {results.length > 0 ? `${results.length} recipes found` : "No matches — try fewer filters"}
          </h2>
          <div className="flex flex-col gap-3">
            {results.map((recipe) => (
              <MealCard key={recipe.id} slot={recipe.slot} recipe={recipe} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
