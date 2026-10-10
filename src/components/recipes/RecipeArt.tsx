function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A deterministic, stylised top-down "plate" built from the recipe's
 * ingredient colours. Shown until a real or AI-generated image exists, and
 * always labelled as an illustration so it's never mistaken for a photo.
 */
export function RecipeArt({
  id,
  palette,
  variant = "plate",
  className,
  stepIndex,
}: {
  id: string;
  palette: string[];
  variant?: "plate" | "bowl";
  className?: string;
  stepIndex?: number;
}) {
  const rand = rng(hash(id + (stepIndex ?? "")));
  const colours = palette.length ? palette : ["#D9B77A", "#5E8C3A", "#C9541E"];
  const bg = ["#F4EEE2", "#EFE6D3", "#F2EBDD", "#EDE4D0"][Math.floor(rand() * 4)];
  const blobs = Array.from({ length: 5 + Math.floor(rand() * 4) }, (_, i) => ({
    cx: 200 + Math.cos(rand() * Math.PI * 2) * (20 + rand() * 60),
    cy: 150 + Math.sin(rand() * Math.PI * 2) * (14 + rand() * 40),
    r: 22 + rand() * 34,
    fill: colours[i % colours.length],
    o: 0.75 + rand() * 0.25,
  }));
  const garnish = Array.from({ length: 14 }, () => ({
    x: 200 + (rand() - 0.5) * 170,
    y: 150 + (rand() - 0.5) * 110,
    r: 2 + rand() * 3.5,
  }));
  const bowl = variant === "bowl" || rand() > 0.55;
  const sideX = rand() > 0.5 ? 330 : 70;
  return (
    <svg viewBox="0 0 400 300" className={className} role="img" aria-hidden preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="300" fill={bg} />
      <g opacity="0.35">
        {Array.from({ length: 6 }, (_, i) => (
          <path key={i} d={`M0 ${40 + i * 48} Q200 ${20 + i * 48 + rand() * 30} 400 ${40 + i * 48}`} stroke="#E2D6BF" strokeWidth="1.5" fill="none" />
        ))}
      </g>
      <ellipse cx="205" cy="160" rx="150" ry="112" fill="#000" opacity="0.06" />
      <circle cx="200" cy="150" r={bowl ? 112 : 128} fill="#FFFFFF" />
      <circle cx="200" cy="150" r={bowl ? 96 : 104} fill={bowl ? "#F7F2E8" : "#FCFAF5"} stroke="#EFE7D8" strokeWidth="2" />
      <g filter="url(#soft)">
        {blobs.map((b, i) => (
          <circle key={i} cx={b.cx} cy={b.cy} r={b.r * (bowl ? 0.9 : 1)} fill={b.fill} opacity={b.o} />
        ))}
      </g>
      {garnish.map((g, i) => (
        <circle key={i} cx={g.x} cy={g.y} r={g.r} fill={i % 3 ? "#3F7D3A" : "#B9DB4A"} opacity="0.85" />
      ))}
      <circle cx={sideX} cy="245" r="34" fill="#FFFFFF" />
      <circle cx={sideX} cy="245" r="26" fill={colours[colours.length - 1]} opacity="0.85" />
      <defs>
        <filter id="soft" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
    </svg>
  );
}
