import { CalendarDays, ChefHat, CookingPot, Dumbbell, HeartPulse, House, LineChart, ListChecks, NotebookPen, ShoppingBasket, UserRound, Utensils } from "lucide-react";
import type { MessageKey } from "@/lib/i18n/messages/en";

type Icon = typeof House;

/** Bottom / side navigation. Today first, Meals second; Train is the centre action. */
export const NAV_ITEMS: { href: string; key: MessageKey; icon: Icon; also?: string[]; primary?: boolean }[] = [
  { href: "/home", key: "nav.home", icon: House },
  { href: "/planner", key: "nav.meals", icon: Utensils, also: ["/recipes", "/cook", "/shopping"] },
  { href: "/workouts", key: "nav.train", icon: Dumbbell, primary: true },
  { href: "/health", key: "nav.health", icon: HeartPulse, also: ["/progress"] },
  { href: "/profile", key: "nav.profile", icon: UserRound, also: ["/settings", "/targets", "/subscription"] },
];

/** Tabs shown at the top of each section's main pages. */
export const SECTION_TABS: { key: MessageKey; items: { href: string; key: MessageKey; icon: Icon }[] }[] = [
  {
    key: "nav.meals",
    items: [
      { href: "/planner", key: "nav.planner", icon: NotebookPen },
      { href: "/recipes", key: "nav.recipes", icon: CookingPot },
      { href: "/cook", key: "nav.cook", icon: ChefHat },
      { href: "/shopping", key: "nav.shoppingShort", icon: ShoppingBasket },
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
  {
    key: "nav.health",
    items: [
      { href: "/health", key: "nav.healthData", icon: HeartPulse },
      { href: "/progress", key: "nav.progress", icon: LineChart },
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
