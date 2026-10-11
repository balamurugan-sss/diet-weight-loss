/** Short date for admin lists, in the app's time zone. */
export function fmtDate(d: Date | null | undefined, timeZone: string) {
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone });
}
