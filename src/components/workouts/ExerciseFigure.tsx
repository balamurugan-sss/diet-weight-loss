"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import type { Pattern } from "@/lib/workouts/types";

/**
 * Looping stick-figure demonstration of a movement pattern, drawn in SVG and
 * animated with SMIL path morphing (no images or libraries). Side view facing
 * right; "far" limbs are drawn fainter. Honours prefers-reduced-motion by
 * showing the key position without movement.
 */

type P = [number, number];
type Joints = "head" | "neck" | "hip" | "kneeN" | "footN" | "kneeF" | "footF" | "elbowN" | "handN" | "elbowF" | "handF";
type Pose = Record<Joints, P>;
type Frame = Partial<Pose>;

const STAND: Pose = {
  head: [60, 21],
  neck: [60, 32],
  hip: [60, 62],
  kneeN: [61, 84],
  footN: [62, 106],
  kneeF: [58, 84],
  footF: [57, 106],
  elbowN: [62, 47],
  handN: [63, 62],
  elbowF: [57, 47],
  handF: [56, 62],
};

/** Far limbs default to the near limb shifted back a little (side view). */
function complete(f: Frame, base: Pose): Pose {
  const shift = (p: P | undefined): P | undefined => (p ? [p[0] - 4, p[1]] : undefined);
  return {
    ...base,
    ...f,
    kneeF: f.kneeF ?? (f.kneeN ? shift(f.kneeN)! : base.kneeF),
    footF: f.footF ?? (f.footN ? shift(f.footN)! : base.footF),
    elbowF: f.elbowF ?? (f.elbowN ? shift(f.elbowN)! : base.elbowF),
    handF: f.handF ?? (f.handN ? shift(f.handN)! : base.handF),
  };
}

type Spec = { frames: Frame[]; dur: number; prop?: "bar" | "bench" | "mat" };

const ARMS_FWD: Frame = { elbowN: [72, 38], handN: [84, 39] };
const PLANK_HIGH: Frame = { head: [90, 73], neck: [80, 78], hip: [50, 88], kneeN: [32, 96], footN: [14, 104], elbowN: [80, 92], handN: [80, 106] };

const SPECS: Record<Pattern, Spec> = {
  squat: {
    dur: 2.6,
    frames: [{ ...ARMS_FWD }, { head: [66, 41], neck: [62, 50], hip: [44, 78], kneeN: [70, 82], footN: [62, 106], elbowN: [76, 54], handN: [88, 54] }],
  },
  lunge: {
    dur: 2.8,
    frames: [
      { kneeN: [64, 84], footN: [66, 106], kneeF: [56, 84], footF: [52, 106] },
      { head: [58, 37], neck: [58, 48], hip: [58, 78], kneeN: [76, 82], footN: [80, 106], kneeF: [46, 100], footF: [30, 104], elbowN: [58, 63], handN: [59, 77] },
    ],
  },
  hinge: {
    dur: 2.8,
    frames: [{}, { head: [92, 45], neck: [82, 49], hip: [48, 62], kneeN: [57, 84], footN: [61, 106], elbowN: [82, 64], handN: [82, 79] }],
  },
  bridge: {
    dur: 2.4,
    prop: "mat",
    frames: [
      { head: [14, 96], neck: [25, 99], hip: [56, 101], kneeN: [74, 82], footN: [86, 106], elbowN: [38, 104], handN: [52, 106] },
      { head: [14, 96], neck: [25, 99], hip: [57, 83], kneeN: [76, 80], footN: [86, 106], elbowN: [38, 104], handN: [52, 106] },
    ],
  },
  pushup: {
    dur: 2.4,
    prop: "mat",
    frames: [{ ...PLANK_HIGH }, { head: [91, 92], neck: [80, 96], hip: [50, 99], kneeN: [32, 102], footN: [14, 104], elbowN: [66, 98], handN: [80, 106] }],
  },
  press: {
    dur: 2.4,
    frames: [
      { elbowN: [70, 45], handN: [68, 31] },
      { elbowN: [63, 15], handN: [62, 3] },
    ],
  },
  row: {
    dur: 2.2,
    frames: [
      { head: [91, 45], neck: [81, 50], hip: [48, 62], kneeN: [56, 84], footN: [60, 106], elbowN: [81, 64], handN: [81, 79] },
      { head: [91, 45], neck: [81, 50], hip: [48, 62], kneeN: [56, 84], footN: [60, 106], elbowN: [66, 52], handN: [77, 64] },
    ],
  },
  pull: {
    dur: 2.6,
    prop: "bar",
    frames: [
      { head: [60, 27], neck: [60, 37], hip: [60, 66], kneeN: [62, 87], footN: [60, 106], elbowN: [62, 21], handN: [61, 7], elbowF: [56, 21], handF: [57, 7] },
      { head: [62, 13], neck: [60, 23], hip: [60, 52], kneeN: [64, 72], footN: [60, 92], elbowN: [72, 23], handN: [61, 7], elbowF: [48, 23], handF: [57, 7] },
    ],
  },
  curl: {
    dur: 2,
    frames: [{}, { elbowN: [62, 47], handN: [72, 37], elbowF: [57, 47], handF: [67, 37] }],
  },
  raise: {
    dur: 2.4,
    frames: [{}, { elbowN: [74, 35], handN: [88, 35], elbowF: [70, 35], handF: [84, 35] }],
  },
  dip: {
    dur: 2.4,
    prop: "bench",
    frames: [
      { head: [45, 36], neck: [43, 46], hip: [47, 76], kneeN: [74, 78], footN: [82, 106], elbowN: [40, 60], handN: [38, 74] },
      { head: [47, 51], neck: [45, 61], hip: [49, 90], kneeN: [74, 82], footN: [82, 106], elbowN: [28, 65], handN: [38, 74] },
    ],
  },
  calf: {
    dur: 1.8,
    frames: [{}, { head: [60, 15], neck: [60, 26], hip: [60, 56], kneeN: [61, 78], footN: [64, 106], kneeF: [58, 78], footF: [59, 106], elbowN: [62, 41], handN: [63, 56], elbowF: [57, 41], handF: [56, 56] }],
  },
  plank: {
    dur: 3,
    prop: "mat",
    frames: [
      { head: [90, 80], neck: [80, 85], hip: [51, 92], kneeN: [32, 98], footN: [13, 104], elbowN: [80, 104], handN: [94, 104] },
      { head: [90, 79], neck: [80, 84], hip: [51, 90], kneeN: [32, 97], footN: [13, 104], elbowN: [80, 104], handN: [94, 104] },
    ],
  },
  crunch: {
    dur: 2.6,
    prop: "mat",
    frames: [
      { head: [17, 94], neck: [28, 98], hip: [56, 102], kneeN: [62, 80], footN: [80, 81], elbowN: [30, 83], handN: [32, 68] },
      { head: [17, 94], neck: [28, 98], hip: [56, 102], kneeN: [76, 94], footN: [94, 98], kneeF: [60, 80], footF: [78, 81], elbowN: [17, 88], handN: [6, 92], elbowF: [26, 83], handF: [28, 68] },
    ],
  },
  superman: {
    dur: 2.6,
    prop: "mat",
    frames: [
      { head: [90, 99], neck: [80, 101], hip: [50, 103], kneeN: [30, 104], footN: [12, 105], elbowN: [96, 101], handN: [108, 101] },
      { head: [90, 92], neck: [80, 96], hip: [50, 103], kneeN: [30, 101], footN: [12, 96], elbowN: [96, 92], handN: [108, 87] },
    ],
  },
  jack: {
    dur: 1,
    frames: [
      { kneeN: [61, 84], footN: [61, 106], kneeF: [59, 84], footF: [59, 106], elbowN: [65, 47], handN: [67, 62], elbowF: [55, 47], handF: [53, 62] },
      { kneeN: [70, 84], footN: [78, 105], kneeF: [50, 84], footF: [42, 105], elbowN: [74, 22], handN: [80, 8], elbowF: [46, 22], handF: [40, 8] },
    ],
  },
  climber: {
    dur: 0.9,
    prop: "mat",
    frames: [
      { ...PLANK_HIGH, kneeN: [70, 92], footN: [58, 102], kneeF: [32, 96], footF: [14, 104] },
      { ...PLANK_HIGH, kneeN: [32, 96], footN: [14, 104], kneeF: [70, 92], footF: [58, 102] },
    ],
  },
  burpee: {
    dur: 3,
    frames: [
      { elbowN: [63, 15], handN: [62, 3] },
      { head: [74, 58], neck: [68, 66], hip: [48, 82], kneeN: [70, 86], footN: [60, 106], elbowN: [72, 86], handN: [74, 106] },
      { ...PLANK_HIGH },
    ],
  },
  march: {
    dur: 1.2,
    frames: [
      { kneeN: [74, 70], footN: [72, 92], elbowN: [54, 46], handN: [50, 58], elbowF: [66, 46], handF: [72, 52] },
      { kneeF: [72, 70], footF: [70, 92], kneeN: [61, 84], footN: [62, 106], elbowF: [54, 46], handF: [50, 58], elbowN: [66, 46], handN: [72, 52] },
    ],
  },
  stretch: {
    dur: 3.2,
    frames: [{}, { head: [64, 22], neck: [62, 33], elbowN: [64, 15], handN: [68, 3], elbowF: [60, 15], handF: [62, 3] }],
  },
};

function paths(p: Pose) {
  const seg = (...pts: P[]) => "M" + pts.map(([x, y]) => `${x} ${y}`).join(" L");
  return {
    torso: seg(p.neck, p.hip),
    legN: seg(p.hip, p.kneeN, p.footN),
    legF: seg(p.hip, p.kneeF, p.footF),
    armN: seg(p.neck, p.elbowN, p.handN),
    armF: seg(p.neck, p.elbowF, p.handF),
  };
}

const reduceQuery = "(prefers-reduced-motion: reduce)";
function subscribe(cb: () => void) {
  const m = window.matchMedia(reduceQuery);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}
const useReducedMotion = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(reduceQuery).matches,
    () => false,
  );

export function ExerciseFigure({ pattern, label, className, animate = true }: { pattern: Pattern; label: string; className?: string; animate?: boolean }) {
  const reduced = useReducedMotion();
  const spec = SPECS[pattern];
  const poses: Pose[] = [];
  for (const f of spec.frames) poses.push(complete(f, poses.length ? complete(spec.frames[0], STAND) : STAND));
  const play = animate && !reduced && poses.length > 1;
  // Loop there and back: A → B (→ C) → … → A.
  const seq = play ? [...poses, ...poses.slice(1, -1).reverse(), poses[0]] : [poses[Math.min(1, poses.length - 1)]];
  const frames = seq.map(paths);
  const keyTimes = seq.map((_, i) => (i / (seq.length - 1)).toFixed(3)).join(";");
  const splines = seq
    .slice(1)
    .map(() => "0.45 0 0.55 1")
    .join(";");

  const anim = (attr: string, values: string[]) =>
    play ? <animate attributeName={attr} dur={`${spec.dur}s`} repeatCount="indefinite" values={values.join(";")} keyTimes={keyTimes} calcMode="spline" keySplines={splines} /> : null;

  const limb = (k: keyof ReturnType<typeof paths>, far = false) => (
    <path d={frames[0][k]} className={far ? "opacity-40" : undefined} strokeWidth={far ? 6 : 7}>
      {anim(
        "d",
        frames.map((f) => f[k]),
      )}
    </path>
  );

  return (
    <svg viewBox="0 0 120 112" {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })} className={cn("text-charcoal", className)}>
      <ellipse cx="60" cy="108" rx="46" ry="3.5" className="fill-lime/25" />
      {spec.prop === "mat" && <rect x="4" y="105" width="112" height="4" rx="2" className="fill-lime/60" />}
      {spec.prop === "bar" && <rect x="34" y="4" width="52" height="4" rx="2" className="fill-lime" />}
      {spec.prop === "bench" && <rect x="16" y="74" width="26" height="6" rx="2" className="fill-lime/70" />}
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {limb("legF", true)}
        {limb("armF", true)}
        {limb("torso")}
        {limb("legN")}
        {limb("armN")}
      </g>
      <circle r="8.5" cx={seq[0].head[0]} cy={seq[0].head[1]} className="fill-lime">
        {anim(
          "cx",
          seq.map((p) => String(p.head[0])),
        )}
        {anim(
          "cy",
          seq.map((p) => String(p.head[1])),
        )}
      </circle>
    </svg>
  );
}
