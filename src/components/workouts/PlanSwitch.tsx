import { Dumbbell, Utensils } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/** Meals | Workouts switch at the top of the Plan tab. */
export function PlanSwitch({ active, labels }: { active: "meals" | "workouts"; labels: { meals: string; workouts: string; switch: string } }) {
  const items = [
    { key: "meals" as const, href: "/planner", label: labels.meals, icon: Utensils },
    { key: "workouts" as const, href: "/workouts", label: labels.workouts, icon: Dumbbell },
  ];
  return (
    <nav aria-label={labels.switch} className="inline-flex rounded-full border border-line bg-surface p-1">
      {items.map(({ key, href, label, icon: Icon }) => (
        <Link
          key={key}
          href={href}
          aria-current={active === key ? "page" : undefined}
          className={cn(
            "inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors",
            active === key ? "bg-forest text-on-accent" : "text-muted hover:text-charcoal",
          )}
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}
