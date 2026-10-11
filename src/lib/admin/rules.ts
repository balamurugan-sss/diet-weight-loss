/**
 * The date premium runs to when `months` are added: from today, or from a
 * later current end date. null = no end (and premium that already has no end
 * keeps it).
 */
export function premiumEnd(currentUntil: Date | null, isActive: boolean, months: number | null, now = new Date()): Date | null {
  if (months == null || (isActive && currentUntil == null)) return null;
  const base = isActive && currentUntil && currentUntil > now ? new Date(currentUntil) : new Date(now);
  base.setMonth(base.getMonth() + months);
  return base;
}

/** Only https links or paths inside the app; anything else is dropped. */
export function safeLink(link: string | null | undefined): string | null {
  const l = (link ?? "").trim();
  if (!l) return null;
  if (/^\/(?!\/)[\w\-./?=&%#]*$/.test(l)) return l;
  try {
    const u = new URL(l);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}
