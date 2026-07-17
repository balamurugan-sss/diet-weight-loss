"use client";

import { motion } from "framer-motion";
import { clamp } from "@/lib/utils";

export function MacroBar({
  label,
  current,
  target,
  unit = "g",
  color,
}: {
  label: string;
  current: number;
  target: number;
  unit?: string;
  color: string;
}) {
  const pct = target > 0 ? clamp((current / target) * 100, 0, 100) : 0;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span style={{ color: "var(--muted)" }}>
          {Math.round(current)} / {Math.round(target)}
          {unit}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--ring-track)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
