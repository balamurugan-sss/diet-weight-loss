"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Salad, Dumbbell, ClipboardList, MessageCircle, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/meals", label: "Meals", icon: Salad },
  { href: "/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/tracker", label: "Track", icon: ClipboardList },
  { href: "/chat", label: "Coach", icon: MessageCircle },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t px-2 pt-2 safe-bottom lg:hidden glass-card !rounded-none !border-x-0 !border-b-0">
      <ul className="mx-auto flex max-w-lg items-center justify-between px-2 pb-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-medium transition-colors",
                  active ? "text-white" : ""
                )}
                style={active ? { backgroundImage: "linear-gradient(135deg, var(--primary), var(--primary-2))" } : { color: "var(--muted)" }}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                {item.label}
              </Link>
            </li>
          );
        })}
        <li>
          <Link
            href="/more"
            className="flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-medium"
            style={pathname === "/more" ? { color: "var(--primary)" } : { color: "var(--muted)" }}
          >
            <Menu size={20} />
            More
          </Link>
        </li>
      </ul>
    </nav>
  );
}
