"use client";

import { useState } from "react";
import {
  Crown,
  Sparkles,
  Salad,
  BookOpen,
  ScanFace,
  Camera,
  BarChart3,
  Mic,
  ShoppingCart,
  UtensilsCrossed,
  Check,
  Loader2,
} from "lucide-react";
import { useUserStore } from "@/lib/store/userStore";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: Sparkles, label: "AI Personal Trainer" },
  { icon: Salad, label: "Unlimited Meal Plans" },
  { icon: BookOpen, label: "Unlimited Recipes" },
  { icon: ScanFace, label: "Body Scan" },
  { icon: Camera, label: "Progress Photos" },
  { icon: BarChart3, label: "Advanced Analytics" },
  { icon: Mic, label: "Voice Coach" },
  { icon: ShoppingCart, label: "Smart Grocery Planner" },
  { icon: UtensilsCrossed, label: "Restaurant Recommendations" },
];

export default function PremiumPage() {
  const isPremium = useUserStore((s) => s.isPremium);
  const setPremium = useUserStore((s) => s.setPremium);
  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function upgrade() {
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setNotice(data.error ?? "Could not start checkout.");
    } catch {
      setNotice("Could not reach the payment server.");
    } finally {
      setLoading(false);
    }
  }

  if (isPremium) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-5">
        <div className="glass-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundImage: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
            <Crown size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold">You&apos;re on FitFusion AI Premium</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>All premium features are unlocked. Thank you for supporting FitFusion AI.</p>
          <button onClick={() => setPremium(false)} className="btn-secondary mt-6 !py-2 text-sm">
            Cancel Premium (dev toggle)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="text-center">
        <span className="chip mx-auto mb-3 w-fit" style={{ color: "var(--accent-2)" }}>
          <Crown size={14} /> FitFusion AI Premium
        </span>
        <h1 className="text-2xl font-bold">Unlock your full potential</h1>
        <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "var(--muted)" }}>
          Go beyond the essentials with AI coaching, unlimited plans, and advanced tracking.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.label} className="glass-card flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-accent text-white">
              <f.icon size={16} />
            </div>
            <p className="text-sm font-medium">{f.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-6">
        <div className="mb-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => setPlan("monthly")}
            className={cn("rounded-2xl border p-4 text-left transition-all", plan === "monthly" && "text-white")}
            style={plan === "monthly" ? { backgroundImage: "linear-gradient(135deg, var(--primary), var(--primary-2))", borderColor: "transparent" } : { borderColor: "var(--card-border)" }}
          >
            <p className="text-sm font-semibold">Monthly</p>
            <p className="text-lg font-bold">$9.99<span className="text-xs font-normal">/mo</span></p>
          </button>
          <button
            onClick={() => setPlan("yearly")}
            className={cn("relative rounded-2xl border p-4 text-left transition-all", plan === "yearly" && "text-white")}
            style={plan === "yearly" ? { backgroundImage: "linear-gradient(135deg, var(--primary), var(--primary-2))", borderColor: "transparent" } : { borderColor: "var(--card-border)" }}
          >
            <span className="absolute -top-2 right-3 rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: "var(--accent)" }}>
              SAVE 33%
            </span>
            <p className="text-sm font-semibold">Yearly</p>
            <p className="text-lg font-bold">$79.99<span className="text-xs font-normal">/yr</span></p>
          </button>
        </div>

        <button onClick={upgrade} disabled={loading} className="btn-primary w-full disabled:opacity-60">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Upgrade Now
        </button>

        {notice && (
          <div className="mt-4 rounded-xl border p-4 text-sm" style={{ borderColor: "var(--card-border)", color: "var(--muted)" }}>
            <p>{notice}</p>
            <button onClick={() => setPremium(true)} className="btn-secondary mt-3 !py-1.5 text-xs">
              Simulate Premium (dev only — no real payment)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
