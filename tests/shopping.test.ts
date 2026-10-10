import { describe, expect, it } from "vitest";
import { INGREDIENTS } from "../content/ingredients";
import { aggregateShopping, practicalQuantity, servingsToBuy, type ShopRecipe } from "@/lib/shopping/aggregate";

const ingMap = new Map(INGREDIENTS.map((i) => [i.id, i]));
const recipes = new Map<string, ShopRecipe>([
  ["sambar", { title: "Sambar", servings: 4, lines: [
    { ingredientId: "toor_dal", grams: 100, optional: false },
    { ingredientId: "onion", grams: 110, optional: false },
    { ingredientId: "tomato", grams: 100, optional: false },
    { ingredientId: "water", grams: 800, optional: false },
    { ingredientId: "cashews", grams: 10, optional: true },
  ] }],
  ["poriyal", { title: "Poriyal", servings: 2, lines: [
    { ingredientId: "cabbage", grams: 300, optional: false },
    { ingredientId: "onion", grams: 55, optional: false },
    { ingredientId: "coconut_oil", grams: 9, optional: false },
  ] }],
  ["omelette", { title: "Omelette", servings: 1, lines: [{ ingredientId: "egg", grams: 100, optional: false }] }],
]);

describe("shopping list", () => {
  it("combines shared ingredients across recipes without double counting", () => {
    const rows = aggregateShopping(
      [{ recipeId: "sambar", portion: 1, swaps: [] }, { recipeId: "poriyal", portion: 1, swaps: [] }],
      recipes, ingMap, 1,
    );
    const onion = rows.filter((r) => r.ingredientId === "onion");
    expect(onion).toHaveLength(1);
    expect(onion[0].grams).toBe(Math.round(110 / 4 + 55 / 2));
    expect(onion[0].recipes.sort()).toEqual(["Poriyal", "Sambar"]);
  });
  it("skips water and optional extras", () => {
    const rows = aggregateShopping([{ recipeId: "sambar", portion: 1, swaps: [] }], recipes, ingMap, 1);
    expect(rows.map((r) => r.ingredientId)).not.toContain("water");
    expect(rows.map((r) => r.ingredientId)).not.toContain("cashews");
  });
  it("scales for the household and the user's portion", () => {
    expect(servingsToBuy(1.5, 4)).toBe(4.5);
    const rows = aggregateShopping([{ recipeId: "sambar", portion: 1.5, swaps: [] }], recipes, ingMap, 4);
    expect(rows.find((r) => r.ingredientId === "toor_dal")!.grams).toBe(Math.round((100 / 4) * 4.5));
  });
  it("applies ingredient swaps with their ratio", () => {
    const rows = aggregateShopping([{ recipeId: "poriyal", portion: 2, swaps: [{ from: "coconut_oil", to: "groundnut_oil", ratio: 1 }] }], recipes, ingMap, 1);
    expect(rows.find((r) => r.ingredientId === "groundnut_oil")!.grams).toBe(9);
    expect(rows.find((r) => r.ingredientId === "coconut_oil")).toBeUndefined();
  });
  it("converts to practical shopping quantities and sections", () => {
    expect(practicalQuantity(ingMap.get("egg")!, 350)).toEqual({ quantity: "7 eggs", buy: "2 × pack of 6" });
    expect(practicalQuantity(ingMap.get("toor_dal")!, 240).quantity).toBe("250 g");
    expect(practicalQuantity(ingMap.get("milk")!, 1100).quantity).toBe("1.1 L");
    const rows = aggregateShopping([{ recipeId: "omelette", portion: 1, swaps: [] }, { recipeId: "poriyal", portion: 1, swaps: [] }], recipes, ingMap, 1);
    expect(rows[0].section).toBe("vegetables");
    expect(rows.find((r) => r.ingredientId === "egg")!.section).toBe("dairy");
  });
  it("estimates cost from quantities used", () => {
    const rows = aggregateShopping([{ recipeId: "omelette", portion: 1, swaps: [] }], recipes, ingMap, 1);
    expect(rows[0].costInr).toBe(Math.round((100 * 127) / 1000));
  });
});
