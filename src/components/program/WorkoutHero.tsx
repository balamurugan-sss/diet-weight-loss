import { ArrowRight, CheckCircle2, Moon, PencilLine, Play } from "lucide-react";
import Link from "next/link";
import { Tags } from "@/components/brand/Brand";
import { ExerciseMedia } from "@/components/workouts/ExerciseMedia";
import type { Exercise } from "@/lib/workouts/types";

export type HeroAction = { href: string; label: string; kind: "start" | "resume" | "edit" | "view" };

/** The big workout card: demo media with tags across the bottom, then one orange action bar. */
export function WorkoutHero({
  lead,
  video,
  tags,
  action,
  done,
  rest,
  restLabel,
}: {
  lead: Exercise | null;
  video?: string;
  tags: string[];
  action: HeroAction | null;
  /** Label for the "done" badge; omitted when not done. */
  done?: string;
  rest?: boolean;
  restLabel?: string;
}) {
  const Icon = action?.kind === "edit" ? PencilLine : action?.kind === "start" || action?.kind === "resume" ? Play : ArrowRight;
  return (
    <section className="overflow-hidden rounded-md bg-surface">
      <div className="relative aspect-[4/3] bg-[radial-gradient(120%_90%_at_50%_10%,#2c2c2c_0%,#161616_70%)]">
        {lead && !rest ? (
          <ExerciseMedia exercise={lead} videoSrc={video} className="h-full w-full bg-transparent" />
        ) : (
          <div className="grid h-full place-items-center text-muted">
            <Moon className="size-16" strokeWidth={1.4} aria-hidden />
            {restLabel && <p className="absolute top-[62%] text-lg font-semibold text-ink-2">{restLabel}</p>}
          </div>
        )}
        {done && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-sm bg-lime px-2.5 py-1 text-sm font-bold text-on-accent">
            <CheckCircle2 className="size-4" aria-hidden /> {done}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-10">
          <Tags items={tags} />
        </div>
      </div>
      {action && (
        <Link
          href={action.href}
          className={
            action.kind === "edit" || action.kind === "view"
              ? "flex min-h-15 items-center justify-between px-4 text-[19px] font-bold text-lime hover:bg-sand"
              : "flex min-h-15 items-center justify-between bg-lime px-4 text-[19px] font-bold text-on-accent hover:bg-lime-600"
          }
        >
          {action.label}
          <Icon className="size-6" aria-hidden />
        </Link>
      )}
    </section>
  );
}
