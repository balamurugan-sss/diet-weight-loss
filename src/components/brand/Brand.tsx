import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

/** Bold diagonal speed stripes, the app's signature graphic. Decorative only. */
export function Squiggle({ className, color = "var(--color-lime)" }: { className?: string; variant?: "wave" | "zig" | "loop"; color?: string }) {
  return (
    <svg viewBox="0 0 300 120" className={cn("pointer-events-none", className)} aria-hidden fill={color} preserveAspectRatio="none">
      <path d="M40 120 L100 0 H148 L88 120 Z" />
      <path d="M118 120 L178 0 H210 L150 120 Z" opacity="0.7" />
      <path d="M180 120 L240 0 H258 L198 120 Z" opacity="0.4" />
    </svg>
  );
}

/** Three short strokes — the little "burst" marks next to headlines in the reference. */
export function Spark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-7", className)} aria-hidden fill="none" stroke="var(--color-lime)" strokeWidth="4.5" strokeLinecap="square">
      <path d="M8 22 L3 18" />
      <path d="M17 13 L15 4" />
      <path d="M27 15 L33 8" />
    </svg>
  );
}

/** Stencil-style side note. English-only decoration; hidden from assistive tech. */
export function Scribble({ lines, className, tone = "light" }: { lines: string[]; className?: string; tone?: "light" | "dark" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "font-display inline-block border-l-4 pl-2 text-[1.15rem] leading-[1.05] font-extrabold tracking-wide uppercase italic",
        tone === "dark" ? "border-[#0a0c0e] text-white" : "border-lime text-lime",
        className,
      )}
    >
      {lines.map((l) => (
        <span key={l} className="block">
          {l}
        </span>
      ))}
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
    <span aria-hidden className={cn("grid size-10 shrink-0 place-items-center rounded-full", dark ? "bg-[#0a0c0e] text-lime" : "bg-lime text-white", className)}>
      <ArrowUpRight className="size-5" strokeWidth={2.5} />
    </span>
  );
}

/** Slanted lime tag, e.g. "Snack · 197 kcal". */
export function StickerPill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("font-display inline-flex -skew-x-6 flex-col items-center rounded-md bg-lime px-4 py-2 text-center text-[14px] leading-tight font-extrabold tracking-wide text-white uppercase shadow-[0_8px_24px_-8px_rgb(255_90_31/0.6)]", className)}>
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

/** Movewell mark: a heavy "M" that doubles as a rising heartbeat. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid size-9 place-items-center rounded-lg bg-lime text-white", className)} aria-hidden>
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M3 18 L7 6 L12 15 L17 6 L21 18" />
      </svg>
    </span>
  );
}

/** Blue uppercase tags on workout and guide cards, e.g. FULL BODY · BEGINNER · HOME. */
export function Tags({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {items.map((x) => (
        <li key={x} className="bg-[var(--color-tag)] px-2 py-0.5 text-[11px] leading-5 font-bold tracking-[0.08em] text-white uppercase">
          {x}
        </li>
      ))}
    </ul>
  );
}
