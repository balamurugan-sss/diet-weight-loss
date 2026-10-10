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

/** The instant of local "HH:MM" on a calendar date in the app's time zone. */
export function zonedInstant(dateISO: string, hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const guess = Date.UTC(Number(dateISO.slice(0, 4)), Number(dateISO.slice(5, 7)) - 1, Number(dateISO.slice(8, 10)), h, m);
  // How far the zone is from UTC at that moment: format the guess in the zone and compare.
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      .formatToParts(new Date(guess))
      .map((p) => [p.type, p.value]),
  );
  const asZone = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour) % 24, Number(parts.minute));
  return new Date(guess - (asZone - guess));
}
