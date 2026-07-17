"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Flame, Repeat, Timer, Dumbbell, AlertTriangle, ShieldCheck, RefreshCw } from "lucide-react";
import type { Exercise } from "@/types";
import { cn } from "@/lib/utils";

export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="solid-card overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl gradient-primary text-white">
            <Dumbbell size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold">{exercise.name}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {exercise.sets} sets × {exercise.reps} · {exercise.equipment}
            </p>
          </div>
        </div>
        <ChevronDown size={18} className={cn("shrink-0 transition-transform", open && "rotate-180")} style={{ color: "var(--muted)" }} />
      </button>

      <div className="flex gap-4 px-4 pb-3 text-xs" style={{ color: "var(--muted)" }}>
        <span className="inline-flex items-center gap-1"><Timer size={12} /> {exercise.restSeconds}s rest</span>
        <span className="inline-flex items-center gap-1"><Flame size={12} /> ~{exercise.caloriesBurned} kcal</span>
        <span className="inline-flex items-center gap-1"><Repeat size={12} /> {exercise.difficulty}</span>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t"
            style={{ borderColor: "var(--card-border)" }}
          >
            <div className="flex flex-col gap-4 p-4 text-sm">
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Steps</p>
                <ol className="list-decimal space-y-1 pl-4">
                  {exercise.instructions.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--warn)" }}>
                  <AlertTriangle size={12} /> Common Mistakes
                </p>
                <ul className="list-disc space-y-1 pl-4">
                  {exercise.commonMistakes.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--primary)" }}>
                  <ShieldCheck size={12} /> Safety Tips
                </p>
                <ul className="list-disc space-y-1 pl-4">
                  {exercise.safetyTips.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="chip w-fit">
                <RefreshCw size={12} /> Alternative: {exercise.alternativeExercise}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
