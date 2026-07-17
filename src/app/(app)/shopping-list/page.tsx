"use client";

import { useMemo, useState } from "react";
import { Check, Trash2, Plus, Printer, RefreshCw } from "lucide-react";
import { usePlanStore } from "@/lib/store/planStore";
import { generateShoppingList, SHOPPING_CATEGORY_LABELS } from "@/lib/ai/shoppingList";
import type { Ingredient } from "@/types";
import { cn } from "@/lib/utils";

const CATEGORY_ORDER: Ingredient["category"][] = ["vegetables", "fruits", "protein", "grains", "dairy", "spices", "healthy-snacks", "other"];

export default function ShoppingListPage() {
  const mealPlan = usePlanStore((s) => s.mealPlan);
  const shoppingList = usePlanStore((s) => s.shoppingList);
  const setShoppingList = usePlanStore((s) => s.setShoppingList);
  const toggleShoppingItem = usePlanStore((s) => s.toggleShoppingItem);
  const deleteShoppingItem = usePlanStore((s) => s.deleteShoppingItem);
  const addShoppingItem = usePlanStore((s) => s.addShoppingItem);
  const clearCheckedShoppingItems = usePlanStore((s) => s.clearCheckedShoppingItems);

  const [newItem, setNewItem] = useState("");

  const grouped = useMemo(() => {
    const map = new Map<Ingredient["category"], typeof shoppingList>();
    for (const item of shoppingList) {
      const arr = map.get(item.category) ?? [];
      arr.push(item);
      map.set(item.category, arr);
    }
    return map;
  }, [shoppingList]);

  function regenerateFromPlan() {
    if (!mealPlan) return;
    setShoppingList(generateShoppingList(mealPlan));
  }

  function addManualItem() {
    const value = newItem.trim();
    if (!value) return;
    addShoppingItem({ name: value, quantity: "1", category: "other" });
    setNewItem("");
  }

  const checkedCount = shoppingList.filter((i) => i.checked).length;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div>
          <h1 className="text-xl font-bold">Shopping List</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {shoppingList.length} items · {checkedCount} checked
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="btn-secondary !py-2 text-sm">
            <Printer size={14} /> Export PDF
          </button>
          <button onClick={regenerateFromPlan} disabled={!mealPlan} className="btn-secondary !py-2 text-sm disabled:opacity-40">
            <RefreshCw size={14} /> Rebuild from meal plan
          </button>
        </div>
      </div>

      <div className="glass-card flex gap-2 p-4 no-print">
        <input
          className="input-field"
          placeholder="Add an item manually"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addManualItem()}
        />
        <button onClick={addManualItem} className="btn-primary !px-4">
          <Plus size={16} />
        </button>
      </div>

      {shoppingList.length === 0 ? (
        <div className="glass-card p-8 text-center text-sm" style={{ color: "var(--muted)" }}>
          No items yet. Go to Meal Planner and tap &ldquo;Build Shopping List From This Week&rdquo;, or add items manually above.
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {CATEGORY_ORDER.filter((cat) => grouped.has(cat)).map((cat) => (
            <div key={cat} className="glass-card p-5">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide" style={{ color: "var(--primary-2)" }}>
                {SHOPPING_CATEGORY_LABELS[cat]}
              </h2>
              <div className="flex flex-col gap-2">
                {grouped.get(cat)!.map((item) => (
                  <div key={item.id} className="solid-card flex items-center gap-3 px-4 py-2.5">
                    <button
                      onClick={() => toggleShoppingItem(item.id)}
                      className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border")}
                      style={item.checked ? { background: "var(--primary)", borderColor: "var(--primary)" } : { borderColor: "var(--card-border)" }}
                    >
                      {item.checked && <Check size={12} className="text-white" />}
                    </button>
                    <div className={cn("min-w-0 flex-1", item.checked && "opacity-50 line-through")}>
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="truncate text-xs" style={{ color: "var(--muted)" }}>{item.quantity}</p>
                    </div>
                    <button onClick={() => deleteShoppingItem(item.id)} className="no-print" style={{ color: "var(--muted)" }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {checkedCount > 0 && (
        <button onClick={clearCheckedShoppingItems} className="btn-secondary self-start !py-2 text-sm no-print">
          Clear {checkedCount} checked items
        </button>
      )}
    </div>
  );
}
