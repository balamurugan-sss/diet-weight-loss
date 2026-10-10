"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export function Chip({
  selected,
  onClick,
  children,
  disabled,
  className,
}: {
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
        selected
          ? "border-forest bg-forest text-on-accent"
          : "border-line bg-surface text-charcoal hover:border-forest/40",
        disabled && "opacity-40",
        className,
      )}
    >
      {selected && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
      {children}
    </button>
  );
}

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: "neutral" | "forest" | "lime" | "amber" | "terracotta" | "water";
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    neutral: "bg-sand text-ink-2",
    forest: "bg-forest-50 text-forest",
    lime: "bg-lime-100 text-forest-700",
    amber: "bg-amber-100 text-amber-ink",
    terracotta: "bg-terracotta-100 text-terracotta",
    water: "bg-water-100 text-water",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}
