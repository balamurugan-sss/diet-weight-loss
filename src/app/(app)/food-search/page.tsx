"use client";

import { useMemo, useState } from "react";
import { Search, ScanBarcode } from "lucide-react";
import { FOODS } from "@/lib/data/foods";
import type { FoodItem } from "@/types";
import { FoodCard } from "@/components/food/FoodCard";
import { VoiceSearchButton } from "@/components/food/VoiceSearchButton";
import { ImageRecognitionButton } from "@/components/food/ImageRecognitionButton";
import { BarcodeScannerModal } from "@/components/food/BarcodeScannerModal";
import { useAdminStore } from "@/lib/store/adminStore";
import { cn } from "@/lib/utils";

const CATEGORY_OPTIONS: { value: FoodItem["category"] | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "indian", label: "Indian Foods" },
  { value: "restaurant", label: "Restaurant" },
  { value: "fast-food", label: "Fast Food" },
  { value: "packaged", label: "Packaged" },
];

export default function FoodSearchPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FoodItem["category"] | "all">("all");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedFood, setScannedFood] = useState<FoodItem | null>(null);
  const customFoods = useAdminStore((s) => s.customFoods);
  const allFoods = useMemo(() => [...FOODS, ...customFoods], [customFoods]);

  const results = useMemo(() => {
    return allFoods.filter((f) => {
      const matchesCategory = category === "all" || f.category === category;
      const matchesQuery = query.trim().length === 0 || f.name.toLowerCase().includes(query.trim().toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [query, category, allFoods]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold">Food Search</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Search Indian, restaurant, fast-food & packaged items to log.</p>
      </div>

      <div className="glass-card p-5">
        <div className="flex gap-2">
          <div className="input-field flex flex-1 items-center gap-2">
            <Search size={16} style={{ color: "var(--muted)" }} />
            <input
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Search foods..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <VoiceSearchButton onResult={(text) => setQuery(text)} />
          <button onClick={() => setScannerOpen(true)} className="chip h-11 w-11 !p-0 justify-center">
            <ScanBarcode size={16} />
          </button>
          <ImageRecognitionButton />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => setCategory(opt.value)} className={cn("chip", category === opt.value && "chip-active")}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {scannedFood && (
        <div className="glass-card p-5">
          <h3 className="mb-2 text-sm font-semibold" style={{ color: "var(--primary-2)" }}>Scanned Product</h3>
          <FoodCard food={scannedFood} />
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {results.map((food) => (
          <FoodCard key={food.id} food={food} />
        ))}
        {results.length === 0 && (
          <p className="py-8 text-center text-sm" style={{ color: "var(--muted)" }}>No foods matched your search.</p>
        )}
      </div>

      {scannerOpen && (
        <BarcodeScannerModal
          onFound={(food) => {
            setScannedFood(food);
            setScannerOpen(false);
          }}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  );
}
