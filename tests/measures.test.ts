import { describe, expect, it } from "vitest";
import { INGREDIENTS } from "../content/ingredients";
import { displayQuantity, friendlyNumber, kitchenText, metricText } from "@/lib/recipes/measures";
import { classifyServing, netCarbs, recipeTotals, scaleNutrients } from "@/lib/recipes/nutrition";

const ing = (id: string) => INGREDIENTS.find((i) => i.id === id)!;

describe("recipe scaling and measures", () => {
  it("formats friendly fractions", () => {
    expect(friendlyNumber(1.5)).toBe("1½");
    expect(friendlyNumber(0.26)).toBe("¼");
    expect(friendlyNumber(2.98)).toBe("3");
  });
  it("uses pieces for vegetables and eggs", () => {
    expect(kitchenText(ing("onion"), 110)).toBe("1 medium onion");
    expect(kitchenText(ing("egg"), 100)).toBe("2 eggs");
  });
  it("never shows silly piece counts", () => {
    expect(kitchenText(ing("paneer"), 250)).toBe("1⅔ cup");
  });
  it("uses spoons for spices and ml for liquids", () => {
    expect(kitchenText(ing("turmeric"), 1.5)).toBe("½ tsp");
    expect(metricText(ing("coconut_oil"), 27.6)).toBe("30 ml");
  });
  it("scales quantities with servings and drops authored measures when scaled", () => {
    const line = { grams: 110, measureText: "1 large onion" };
    expect(displayQuantity(ing("onion"), line, 1, "kitchen").primary).toBe("1 large onion");
    expect(displayQuantity(ing("onion"), line, 2, "kitchen").primary).toBe("2 medium onions");
    expect(displayQuantity(ing("onion"), line, 2, "metric").primary).toBe("220 g");
  });
});

describe("nutrition from ingredients", () => {
  const lookup = (id: string) => INGREDIENTS.find((i) => i.id === id);
  it("net carbs subtract fibre and sugar alcohols", () => {
    expect(netCarbs(10, 4)).toBe(6);
    expect(netCarbs(10, 4, 5)).toBe(1);
    expect(netCarbs(3, 5)).toBe(0);
    const n = recipeTotals([{ ingredientId: "erythritol", grams: 20 }], lookup);
    expect(n.netCarbsG).toBe(0);
  });
  it("excludes optional lines and scales per serving", () => {
    const totals = recipeTotals(
      [
        { ingredientId: "paneer", grams: 200 },
        { ingredientId: "cashews", grams: 30, optional: true },
      ],
      lookup,
    );
    expect(Math.round(totals.kcal)).toBe(530);
    expect(Math.round(scaleNutrients(totals, 0.5).proteinG * 10) / 10).toBe(18.3);
  });
  it("does not call a dish keto just because it has paneer", () => {
    const paneerWithPotato = recipeTotals(
      [
        { ingredientId: "paneer", grams: 100 },
        { ingredientId: "potato", grams: 150 },
      ],
      lookup,
    );
    expect(classifyServing(paneerWithPotato).isKeto).toBe(false);
    const plainPaneer = recipeTotals([{ ingredientId: "paneer", grams: 100 }, { ingredientId: "spinach", grams: 100 }], lookup);
    expect(classifyServing(plainPaneer).isKeto).toBe(true);
  });
});
