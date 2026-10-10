"use client";

import Link from "next/link";
import { LogoMark } from "@/components/brand/Brand";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import { isNavActive, NAV_ITEMS } from "./nav";

export function BottomNav() {
  const path = usePathname();
  const { t } = useI18n();
  return (
    <nav aria-label="Primary" className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const { href, key, icon: Icon } = item;
          const active = isNavActive(item, path);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn("flex min-h-16 flex-col items-center justify-center gap-1 text-[12px] leading-tight font-medium", active ? "text-lime" : "text-muted")}
              >
                <Icon className="size-6" strokeWidth={active ? 2.2 : 1.8} aria-hidden />
                <span className="line-clamp-1 max-w-full px-0.5 text-center">{t(key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SideNav({ footer }: { footer?: React.ReactNode }) {
  const path = usePathname();
  const { t } = useI18n();
  return (
    <aside className="no-print sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface/60 px-4 py-6 lg:flex">
      <Link href="/home" className="mb-8 flex items-center gap-2.5 px-2">
        <LogoMark />
        <span className="font-display text-2xl font-extrabold">{t("app.name")}</span>
      </Link>
      <ul className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const { href, key, icon: Icon } = item;
          const active = isNavActive(item, path);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-[15px] font-semibold transition-colors",
                  active ? "bg-sand text-lime" : "text-ink-2 hover:bg-sand",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto">{footer}</div>
    </aside>
  );
}
