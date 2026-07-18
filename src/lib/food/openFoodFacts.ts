import type { FoodItem } from "@/types";

interface OpenFoodFactsResponse {
  status: number;
  product?: {
    product_name?: string;
    serving_size?: string;
    nutriments?: Record<string, number>;
  };
}

export async function fetchProductByBarcode(barcode: string): Promise<FoodItem | null> {
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`);
  if (!res.ok) throw new Error("Product lookup failed");

  const data: OpenFoodFactsResponse = await res.json();
  if (data.status !== 1 || !data.product) return null;

  const n = data.product.nutriments ?? {};
  const per100 = {
    calories: n["energy-kcal_100g"] ?? 0,
    proteinG: n["proteins_100g"] ?? 0,
    carbsG: n["carbohydrates_100g"] ?? 0,
    fatG: n["fat_100g"] ?? 0,
    fiberG: n["fiber_100g"] ?? 0,
    sugarG: n["sugars_100g"] ?? 0,
    sodiumMg: (n["sodium_100g"] ?? 0) * 1000,
  };

  return {
    id: `off-${barcode}`,
    name: data.product.product_name || "Unknown product",
    category: "packaged",
    servingSize: data.product.serving_size || "100 g",
    calories: Math.round(per100.calories),
    proteinG: Math.round(per100.proteinG),
    carbsG: Math.round(per100.carbsG),
    fatG: Math.round(per100.fatG),
    fiberG: Math.round(per100.fiberG),
    sugarG: Math.round(per100.sugarG),
    sodiumMg: Math.round(per100.sodiumMg),
  };
}
