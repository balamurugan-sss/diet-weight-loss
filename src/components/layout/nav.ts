import { CalendarDays, ChartColumn, Compass, Dumbbell, ListChecks, NotebookPen, PersonStanding, ShoppingBasket, Utensils } from "lucide-react";
import type { MessageKey } from "@/lib/i18n/messages/en";

type Icon = typeof PersonStanding;

/** Bottom / side navigation: My program · Explore · Meals · Me. */
export const NAV_ITEMS: { href: string; key: MessageKey; icon: Icon; also?: string[] }[] = [
  { href: "/home", key: "nav.home", icon: PersonStanding, also: ["/workouts"] },
  { href: "/explore", key: "nav.explore", icon: Compass },
  { href: "/planner", key: "nav.meals", icon: Utensils, also: ["/recipes", "/cook", "/shopping"] },
  { href: "/me", key: "nav.me", icon: ChartColumn, also: ["/health", "/progress", "/profile", "/settings", "/targets", "/subscription"] },
];

/** Segmented tabs shown at the top of a section's main pages. */
export const SECTION_TABS: { key: MessageKey; items: { href: string; key: MessageKey; icon: Icon }[] }[] = [
  {
    key: "nav.meals",
    items: [
      { href: "/planner", key: "meals.plan", icon: NotebookPen },
      { href: "/shopping", key: "meals.shopping", icon: ShoppingBasket },
    ],
  },
  {
    key: "nav.train",
    items: [
      { href: "/workouts", key: "nav.planner", icon: ListChecks },
      { href: "/workouts/calendar", key: "cal.short", icon: CalendarDays },
      { href: "/workouts/library", key: "nav.exercises", icon: Dumbbell },
    ],
  },
];

export function isNavActive(item: { href: string; also?: string[] }, path: string) {
  return [item.href, ...(item.also ?? [])].some((h) => path === h || path.startsWith(h + "/"));
}

/** The section whose tab row should show on this exact path (`/planner/new` counts as the plan tab). */
export function sectionFor(path: string) {
  for (const s of SECTION_TABS) {
    const hit = s.items.find((i) => path === i.href || (i.href === "/planner" && path === "/planner/new"));
    if (hit) return { section: s, active: hit.href };
  }
  return null;
}
