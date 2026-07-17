"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Salad,
  Dumbbell,
  ClipboardList,
  MessageCircle,
  LineChart,
  ShoppingCart,
  Search,
  FileText,
  Crown,
  Shield,
  Settings,
  Sparkles,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const GROUPS = [
  {
    title: "Coach",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: Home },
      { href: "/chat", label: "AI Chat Coach", icon: MessageCircle },
      { href: "/insights", label: "AI Insights", icon: Sparkles },
    ],
  },
  {
    title: "Nutrition",
    items: [
      { href: "/meals", label: "Meal Planner", icon: Salad },
      { href: "/recipes/generator", label: "Recipe Generator", icon: Sparkles },
      { href: "/food-search", label: "Food Search", icon: Search },
      { href: "/shopping-list", label: "Shopping List", icon: ShoppingCart },
    ],
  },
  {
    title: "Fitness",
    items: [
      { href: "/workouts", label: "Workout Planner", icon: Dumbbell },
      { href: "/tracker", label: "Daily Tracker", icon: ClipboardList },
      { href: "/progress", label: "Progress", icon: LineChart },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/reports", label: "Reports", icon: FileText },
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/premium", label: "Premium", icon: Crown },
      { href: "/settings", label: "Settings", icon: Settings },
      { href: "/admin", label: "Admin Panel", icon: Shield },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r px-4 py-6 lg:flex" style={{ borderColor: "var(--card-border)" }}>
      <Link href="/dashboard" className="flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-white font-bold">F</div>
        <span className="text-lg font-bold">
          Fit<span className="gradient-text">Fusion</span> AI
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-6">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              {group.title}
            </p>
            <ul className="flex flex-col gap-1">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname?.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                        active ? "text-white" : "hover:bg-black/5 dark:hover:bg-white/5"
                      )}
                      style={active ? { backgroundImage: "linear-gradient(135deg, var(--primary), var(--primary-2))" } : { color: "var(--foreground)" }}
                    >
                      <Icon size={18} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}
