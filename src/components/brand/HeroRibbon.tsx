import { RecipeArt } from "@/components/recipes/RecipeArt";
import { Scribble, Spark } from "./Brand";

/** Landing hero: a lime ribbon carrying words, wrapped around a plate. Purely decorative. */
export function HeroRibbon({ words, recipeId, palette, notes }: { words: string; recipeId: string; palette: string[]; notes: boolean }) {
  const path = "M -40 330 C 60 330, 90 230, 170 200 S 300 230, 330 150 S 330 30, 430 20";
  return (
    <div className="relative mx-auto aspect-[4/4.1] w-full max-w-[26rem]" aria-hidden>
      <svg viewBox="0 0 400 410" className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <path id="hero-ribbon" d={path} />
        </defs>
        <use href="#hero-ribbon" stroke="var(--color-lime)" strokeWidth="64" strokeLinecap="round" fill="none" />
        <text fill="#0c0c0b" fontSize="25" fontWeight="800" letterSpacing="2.5" dy="9" style={{ fontFamily: "var(--font-display)" }}>
          <textPath href="#hero-ribbon" startOffset="6%">
            {words}
          </textPath>
        </text>
      </svg>
      <div className="absolute top-[18%] left-1/2 size-[54%] -translate-x-1/2 overflow-hidden rounded-full shadow-[0_24px_60px_-20px_rgb(0_0_0/0.9)] ring-8 ring-[#0c0c0b]/60">
        <RecipeArt id={recipeId} palette={palette} stroke={false} className="h-full w-full scale-[1.35]" />
      </div>
      {notes && (
        <>
          <Scribble lines={["Small", "steps", "real change"]} className="absolute top-[2%] left-[2%] -rotate-6" />
          <Scribble lines={["More energy", "happier you"]} className="absolute right-[0%] bottom-[18%] rotate-3 text-right" />
          <Spark className="absolute top-[6%] left-[34%] rotate-12" />
        </>
      )}
    </div>
  );
}
