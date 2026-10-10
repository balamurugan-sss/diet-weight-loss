/**
 * Calendar dates are in Indian Standard Time by default so "today" matches
 * the user's day; override with APP_TIMEZONE.
 */
const TZ = process.env.APP_TIMEZONE || "Asia/Kolkata";
/** The app's time zone, for formatting instants on the server. */
export const APP_TIMEZONE = TZ;

export function todayISO(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function addDaysISO(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string) {
  return Math.round((new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86400000);
}

export function hourNow() {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "numeric", hourCycle: "h23" }).format(new Date()));
}

/** Local "HH:MM" (24 h) for an instant. */
export function clockAt(d = new Date()) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
}
