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
 * Deterministic stylised top-down "plate" built from the recipe's ingredient
 * colours, with the app's lime brush stroke. Shown until a real or AI image
 * exists, and always labelled as an illustration.
 */
const q = (n: number) => Math.round(n * 100) / 100;

export function RecipeArt({
  id,
  palette,
  className,
  stepIndex,
  stroke = true,
}: {
  id: string;
  palette: string[];
  className?: string;
  stepIndex?: number;
  stroke?: boolean;
}) {
  const rand = rng(hash(id + (stepIndex ?? "")));
  const colours = palette.length ? palette : ["#D9B77A", "#5E8C3A", "#C9541E"];
  const blobs = Array.from({ length: 5 + Math.floor(rand() * 4) }, (_, i) => ({
    // Rounded: Math.cos/sin can differ in the last digit between server and browser engines (hydration).
    cx: q(200 + Math.cos(rand() * Math.PI * 2) * (20 + rand() * 60)),
    cy: q(150 + Math.sin(rand() * Math.PI * 2) * (14 + rand() * 40)),
    r: q(22 + rand() * 34),
    fill: colours[i % colours.length],
    o: q(0.8 + rand() * 0.2),
  }));
  const garnish = Array.from({ length: 14 }, () => ({ x: q(200 + (rand() - 0.5) * 170), y: q(150 + (rand() - 0.5) * 110), r: q(2 + rand() * 3.5) }));
  const bowl = rand() > 0.55;
  const sideX = rand() > 0.5 ? 330 : 70;
  const sy = 40 + rand() * 40;
  const uid = `ra${hash(id) % 100000}${stepIndex ?? ""}`;
  return (
    <svg viewBox="0 0 400 300" className={className} role="img" aria-hidden preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="300" fill="var(--color-art-bg)" />
      {Array.from({ length: 6 }, (_, i) => (
        <path key={i} d={`M0 ${40 + i * 48} Q200 ${20 + i * 48 + rand() * 30} 400 ${40 + i * 48}`} stroke="var(--color-art-grain)" strokeWidth="1.5" fill="none" />
      ))}
      {stroke && (
        <path
          d={`M-20 ${sy + 150} C 60 ${sy + 40}, 140 ${sy + 60}, 200 ${sy + 120} S 330 ${sy + 200}, 420 ${sy + 60}`}
          stroke="var(--color-lime)"
          strokeWidth="34"
          strokeLinecap="round"
          fill="none"
          opacity="0.95"
        />
      )}
      <ellipse cx="205" cy="160" rx="150" ry="112" fill="#000" opacity="0.18" />
      <circle cx="200" cy="150" r={bowl ? 112 : 128} fill="var(--color-art-plate)" />
      <circle cx="200" cy="150" r={bowl ? 96 : 104} fill="var(--color-art-plate-inner)" stroke="var(--color-art-rim)" strokeWidth="2" />
      <g filter={`url(#${uid})`}>
        {blobs.map((b, i) => (
          <circle key={i} cx={b.cx} cy={b.cy} r={q(b.r * (bowl ? 0.9 : 1))} fill={b.fill} opacity={b.o} />
        ))}
      </g>
      {garnish.map((g, i) => (
        <circle key={i} cx={g.x} cy={g.y} r={g.r} fill={i % 3 ? "#3F7D3A" : "#B9DB4A"} opacity="0.9" />
      ))}
      <circle cx={sideX} cy="245" r="34" fill="var(--color-art-plate)" />
      <circle cx={sideX} cy="245" r="26" fill={colours[colours.length - 1]} opacity="0.9" />
      <defs>
        <filter id={uid} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
    </svg>
  );
}
