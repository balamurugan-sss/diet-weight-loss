"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Plus } from "lucide-react";
import { useTrackerStore } from "@/lib/store/trackerStore";
import { todayKey } from "@/lib/utils";

interface VisionFood {
  name: string;
  servingSize: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ImageRecognitionButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const logFood = useTrackerStore((s) => s.logFood);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "unavailable">("idle");
  const [result, setResult] = useState<VisionFood | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleFile(file: File) {
    setStatus("loading");
    setResult(null);
    setMessage(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await fetch("/api/food-vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(res.status === 503 ? "unavailable" : "error");
        setMessage(data.error ?? "Couldn't analyze that image.");
        return;
      }
      setResult(data.food);
      setStatus("idle");
    } catch {
      setStatus("error");
      setMessage("Couldn't analyze that image. Please try again.");
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <button onClick={() => inputRef.current?.click()} className="chip h-11 w-11 !p-0 justify-center">
        {status === "loading" ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
      </button>

      {message && (
        <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
          {message}
          {status === "unavailable" && " (Add OPENAI_API_KEY on the server to enable image recognition.)"}
        </p>
      )}

      {result && (
        <div className="solid-card mt-3 flex items-center justify-between p-3">
          <div>
            <p className="text-sm font-semibold">{result.name}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {result.servingSize} · {result.calories} kcal · {result.proteinG}g protein
            </p>
          </div>
          <button
            onClick={() => {
              logFood(todayKey(), {
                id: crypto.randomUUID(),
                foodName: result.name,
                servingSize: result.servingSize,
                calories: result.calories,
                proteinG: result.proteinG,
                carbsG: result.carbsG,
                fatG: result.fatG,
                slot: "lunch",
                loggedAt: new Date().toISOString(),
              });
              setResult(null);
            }}
            className="btn-primary !py-1.5 text-xs"
          >
            <Plus size={12} /> Log it
          </button>
        </div>
      )}
    </div>
  );
}
