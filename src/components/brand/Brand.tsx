import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

/** Thick hand-painted ribbon, the app's signature graphic. Decorative only. */
export function Squiggle({ className, variant = "wave", color = "var(--color-lime)" }: { className?: string; variant?: "wave" | "zig" | "loop"; color?: string }) {
  const paths = {
    wave: "M-10 140 C 60 40, 130 40, 180 120 S 300 220, 360 120 S 470 20, 520 90",
    zig: "M10 120 L70 60 L110 130 L170 50 L210 140 L270 70",
    loop: "M20 150 C 80 20, 200 20, 200 110 C 200 190, 90 180, 120 110 C 150 40, 260 40, 330 90",
  } as const;
  const width = variant === "zig" ? 22 : 46;
  return (
    <svg viewBox={variant === "zig" ? "0 0 280 190" : "0 0 500 220"} className={cn("pointer-events-none", className)} aria-hidden fill="none" preserveAspectRatio="none">
      <path d={paths[variant]} stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      <path d={paths[variant]} stroke="#0c0c0b" strokeOpacity="0.08" strokeWidth={width * 0.35} strokeLinecap="round" strokeDasharray="2 18" />
    </svg>
  );
}

/** Three short strokes — the little "burst" marks next to headlines in the reference. */
export function Spark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-7", className)} aria-hidden fill="none" stroke="var(--color-lime)" strokeWidth="4.5" strokeLinecap="round">
      <path d="M8 22 L3 18" />
      <path d="M17 13 L15 4" />
      <path d="M27 15 L33 8" />
    </svg>
  );
}

/** Handwritten side note with a scribbled underline. English-only decoration; hidden from assistive tech. */
export function Scribble({ lines, className, tone = "light" }: { lines: string[]; className?: string; tone?: "light" | "dark" }) {
  return (
    <span aria-hidden className={cn("font-hand inline-block text-[1.35rem]", tone === "dark" ? "text-[#0c0c0b]" : "text-lime", className)}>
      {lines.map((l) => (
        <span key={l} className="block">
          {l}
        </span>
      ))}
      <svg viewBox="0 0 80 14" className="mt-0.5 h-3 w-16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <path d="M2 8 C 20 2, 40 12, 78 4" />
        <path d="M24 12 C 34 9, 44 11, 58 9" strokeOpacity="0.6" />
      </svg>
    </span>
  );
}

/** Heading where the final word picks up the lime highlight. */
export function TwoTone({ text, className, as: Tag = "h1" }: { text: string; className?: string; as?: "h1" | "h2" }) {
  const words = text.trim().split(/\s+/);
  const last = words.pop();
  return (
    <Tag className={className}>
      {words.join(" ")} {last && <span className="highlight">{last}</span>}
    </Tag>
  );
}

export function ArrowCircle({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <span aria-hidden className={cn("grid size-10 shrink-0 place-items-center rounded-full", dark ? "bg-[#0c0c0b] text-lime" : "bg-lime text-[#0c0c0b]", className)}>
      <ArrowUpRight className="size-5" strokeWidth={2.5} />
    </span>
  );
}

/** Rotated lime sticker pill, e.g. "Sat, Jul 12 · 7:00 AM" in the reference. */
export function StickerPill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex -rotate-6 flex-col items-center rounded-[1.4rem] bg-lime px-4 py-2 text-center text-[13px] leading-tight font-bold text-[#0c0c0b] shadow-[0_8px_24px_-8px_rgb(212_242_63/0.6)]", className)}>
      {children}
    </span>
  );
}

/** Divided stats row: value on top, small label under. */
export function StatStrip({ items, className }: { items: { value: React.ReactNode; label: string }[]; className?: string }) {
  return (
    <dl className={cn("grid divide-x divide-line rounded-2xl border border-line bg-sand/60", className)} style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((it) => (
        <div key={it.label} className="px-2 py-3 text-center">
          <dd className="text-[15px] font-bold tabular">{it.value}</dd>
          <dt className="mt-0.5 text-[11px] text-muted">{it.label}</dt>
        </div>
      ))}
    </dl>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid size-9 place-items-center rounded-xl bg-lime text-[#0c0c0b]", className)} aria-hidden>
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 13h18a9 9 0 0 1-18 0Z" />
        <path d="M8 9c0-2 2-2 2-4M13 9c0-2 2-2 2-4" />
      </svg>
    </span>
  );
}
