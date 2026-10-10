import Link from "next/link";
import { Tags } from "@/components/brand/Brand";
import { ExerciseFigure } from "@/components/workouts/ExerciseFigure";
import type { Guide } from "@/lib/guides/types";

/** Art for a guide: its movement drawn on a dark panel with angled orange stripes. */
function Art({ guide, className }: { guide: Guide; className: string }) {
  return (
    <div className={`relative overflow-hidden bg-[radial-gradient(120%_100%_at_70%_20%,#2c2c2c_0%,#151515_70%)] ${className}`}>
      <span className="absolute -left-6 h-[140%] w-10 -translate-y-6 -skew-x-[20deg] bg-lime/80" aria-hidden />
      <span className="absolute left-8 h-[140%] w-2 -translate-y-6 -skew-x-[20deg] bg-lime/50" aria-hidden />
      <ExerciseFigure pattern={guide.pattern} label="" animate={false} className="absolute inset-y-[8%] right-[4%] h-[84%] w-auto" />
    </div>
  );
}

export function ProgramCard({ guide, label }: { guide: Guide; label: string }) {
  return (
    <Link href={`/explore/${guide.slug}`} className="group block overflow-hidden rounded-md bg-surface">
      <div className="relative">
        <Art guide={guide} className="aspect-[16/9]" />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <Tags items={guide.tags.slice(0, 3)} />
        </div>
      </div>
      <div className="p-4">
        <p className="text-[1.15rem] leading-tight font-bold group-hover:text-lime">{guide.title}</p>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{guide.summary}</p>
        <p className="mt-2 text-sm font-semibold text-lime">{label} →</p>
      </div>
    </Link>
  );
}

export function GuideRow({ guide, minutes }: { guide: Guide; minutes: string }) {
  return (
    <Link href={`/explore/${guide.slug}`} className="group flex items-center gap-4 rounded-md bg-surface p-3 hover:bg-sand">
      <Art guide={guide} className="size-20 shrink-0 rounded-sm" />
      <span className="min-w-0 flex-1">
        <span className="block leading-tight font-bold group-hover:text-lime">{guide.title}</span>
        <span className="mt-1 line-clamp-2 block text-sm text-muted">{guide.summary}</span>
        <span className="mt-1 block text-xs font-bold tracking-[0.08em] text-muted uppercase">{minutes}</span>
      </span>
    </Link>
  );
}

export { Art as GuideArt };
