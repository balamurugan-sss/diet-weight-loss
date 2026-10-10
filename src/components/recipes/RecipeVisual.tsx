import { Camera, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { RecipeArt } from "./RecipeArt";

/**
 * Shows a stored image (AI illustration or verified photo) or the
 * deterministic placeholder art. Every variant carries a visible label so an
 * AI image is never mistaken for a real photograph.
 */
export function RecipeVisual({
  recipeId,
  palette,
  image,
  className,
  labels,
  showLabel = true,
  stepIndex,
  alt,
}: {
  recipeId: string;
  palette: string[];
  image?: { id: string; kind: "ai_illustration" | "verified_photo" } | null;
  className?: string;
  labels: { ai: string; photo: string; placeholder: string };
  showLabel?: boolean;
  stepIndex?: number;
  alt: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-sand", className)}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- served from our own cached media route
        <img src={`/api/media/image/${image.id}`} alt={alt} className="h-full w-full object-cover" loading="lazy" decoding="async" />
      ) : (
        <RecipeArt id={recipeId} palette={palette} stepIndex={stepIndex} className="h-full w-full" />
      )}
      {showLabel && (
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-charcoal/70 px-2 py-0.5 text-[10.5px] font-semibold text-white backdrop-blur">
          {image?.kind === "verified_photo" ? <Camera className="size-3" aria-hidden /> : <Sparkles className="size-3" aria-hidden />}
          {image ? (image.kind === "verified_photo" ? labels.photo : labels.ai) : labels.placeholder}
        </span>
      )}
    </div>
  );
}
