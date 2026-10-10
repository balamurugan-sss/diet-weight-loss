import { cn } from "@/lib/cn";
import type { Exercise } from "@/lib/workouts/types";
import { ExerciseFigure } from "./ExerciseFigure";

/**
 * The exercise's media slot: a supplied photo/video/GIF when the exercise has
 * one, otherwise the built-in animated figure.
 */
export function ExerciseMedia({
  exercise,
  className,
  animate = true,
  label,
  videoSrc,
}: {
  exercise: Exercise;
  className?: string;
  animate?: boolean;
  label?: string;
  /** An approved AI demo clip; takes priority over the drawn figure. */
  videoSrc?: string;
}) {
  const media = videoSrc ? ({ kind: "video", src: videoSrc } as const) : exercise.media;
  return (
    <div className={cn("relative overflow-hidden bg-sand", className)}>
      {media?.kind === "video" ? (
        <video src={media.src} className="h-full w-full object-cover" autoPlay={animate} muted loop playsInline aria-label={exercise.name} />
      ) : media?.kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element -- exercise media can be GIFs from any configured source
        <img src={media.src} alt={exercise.name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
      ) : (
        <ExerciseFigure pattern={exercise.pattern} label={exercise.name} animate={animate} className="h-full w-full p-[8%]" />
      )}
      {label && (
        <span className="absolute bottom-2 left-2 rounded-full bg-scrim px-2 py-0.5 text-[10.5px] font-semibold text-white backdrop-blur">{label}</span>
      )}
    </div>
  );
}
