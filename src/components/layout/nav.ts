import { ChefHat, CookingPot, House, LineChart, NotebookPen, UserRound } from "lucide-react";
import type { MessageKey } from "@/lib/i18n/messages/en";

export const NAV_ITEMS: { href: string; key: MessageKey; icon: typeof House }[] = [
  { href: "/home", key: "nav.home", icon: House },
  { href: "/planner", key: "nav.planner", icon: NotebookPen },
  { href: "/recipes", key: "nav.recipes", icon: CookingPot },
  { href: "/cook", key: "nav.cook", icon: ChefHat },
  { href: "/progress", key: "nav.progress", icon: LineChart },
  { href: "/profile", key: "nav.profile", icon: UserRound },
];
