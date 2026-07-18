"use client";

import { useEffect, useRef, useState } from "react";
import { X, ScanBarcode, Loader2 } from "lucide-react";
import type { IScannerControls } from "@zxing/browser";
import type { FoodItem } from "@/types";
import { fetchProductByBarcode } from "@/lib/food/openFoodFacts";

export function BarcodeScannerModal({
  onFound,
  onClose,
}: {
  onFound: (food: FoodItem) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [status, setStatus] = useState<"idle" | "scanning" | "loading" | "error" | "camera-unavailable">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function start() {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        setStatus("scanning");
        const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result) => {
          if (result && active) {
            controlsRef.current?.stop();
            lookup(result.getText());
          }
        });
        controlsRef.current = controls;
      } catch {
        if (active) setStatus("camera-unavailable");
      }
    }

    start();
    return () => {
      active = false;
      controlsRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function lookup(barcode: string) {
    setStatus("loading");
    setError(null);
    try {
      const food = await fetchProductByBarcode(barcode);
      if (food) {
        onFound(food);
      } else {
        setError("Product not found for that barcode. Try manual search instead.");
        setStatus("idle");
      }
    } catch {
      setError("Couldn't reach the product database. Check your connection and try again.");
      setStatus("idle");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="glass-card w-full max-w-sm p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold"><ScanBarcode size={18} /> Scan Barcode</h3>
          <button onClick={onClose} style={{ color: "var(--muted)" }}><X size={18} /></button>
        </div>

        {status !== "camera-unavailable" && (
          <div className="mb-4 aspect-video overflow-hidden rounded-xl" style={{ background: "black" }}>
            <video ref={videoRef} className="h-full w-full object-cover" muted />
          </div>
        )}

        {status === "loading" && (
          <p className="mb-3 flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
            <Loader2 size={14} className="animate-spin" /> Looking up product...
          </p>
        )}
        {status === "camera-unavailable" && (
          <p className="mb-3 text-sm" style={{ color: "var(--muted)" }}>
            Camera unavailable — enter the barcode number manually below.
          </p>
        )}
        {error && <p className="mb-3 text-sm" style={{ color: "var(--accent)" }}>{error}</p>}

        <div className="flex gap-2">
          <input
            className="input-field"
            placeholder="Enter barcode number"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
          />
          <button onClick={() => manualCode && lookup(manualCode)} className="btn-primary !px-4">
            Go
          </button>
        </div>
      </div>
    </div>
  );
}
