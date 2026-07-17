"use client";

import Link from "next/link";
import { Bell, Crown } from "lucide-react";
import { format } from "date-fns";
import { useUserStore } from "@/lib/store/userStore";
import { ThemeToggle } from "./ThemeToggle";

export function TopBar() {
  const profile = useUserStore((s) => s.profile);
  const isPremium = useUserStore((s) => s.isPremium);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur-xl lg:px-8" style={{ borderColor: "var(--card-border)", background: "color-mix(in srgb, var(--background) 75%, transparent)" }}>
      <div>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          {format(new Date(), "EEEE, MMM d")}
        </p>
        <h1 className="text-base font-bold lg:text-lg">
          {greeting}
          {profile ? `, ${profile.name.split(" ")[0]}` : ""} 👋
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {!isPremium && (
          <Link href="/premium" className="chip hidden sm:inline-flex" style={{ color: "var(--accent-2)" }}>
            <Crown size={14} /> Go Premium
          </Link>
        )}
        <Link href="/notifications" className="chip h-9 w-9 !p-0 justify-center">
          <Bell size={16} />
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
