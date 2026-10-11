"use client";

import { ArrowLeft, Clapperboard, LayoutDashboard, Megaphone, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/admin", key: "admin.nav.overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", key: "admin.nav.users", icon: Users },
  { href: "/admin/messages", key: "admin.nav.messages", icon: Megaphone },
  { href: "/admin/media", key: "admin.nav.media", icon: Clapperboard },
] as const;

/** The admin area's own navigation: a sidebar on desktop, a scrolling tab row on phones. */
export function AdminNav() {
  const path = usePathname();
  const { t } = useI18n();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col">
      {ITEMS.map(({ href, key, icon: Icon, ...rest }) => {
        const active = "exact" in rest ? path === href : path === href || path.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn("flex h-11 shrink-0 items-center gap-2.5 rounded-md px-3 text-[15px] font-semibold", active ? "bg-lime text-on-accent" : "text-ink-2 hover:bg-sand")}
          >
            <Icon className="size-5" aria-hidden /> {t(key)}
          </Link>
        );
      })}
      <Link href="/home" className="flex h-11 shrink-0 items-center gap-2.5 rounded-md px-3 text-[15px] text-muted hover:bg-sand lg:mt-4">
        <ArrowLeft className="size-5" aria-hidden /> {t("admin.nav.back")}
      </Link>
    </nav>
  );
}
