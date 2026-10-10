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
    <nav
      aria-label="Primary"
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-6">
        {NAV_ITEMS.map((item) => {
          const { href, key, icon: Icon } = item;
          const active = isNavActive(item, path);
          const cook = href === "/cook";
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-0.5 text-[10.5px] font-semibold leading-tight",
                  active ? "text-forest" : "text-muted",
                )}
              >
                <span
                  className={cn(
                    "grid place-items-center rounded-full transition-colors",
                    cook ? "size-10 bg-lime text-forest-700 shadow-[var(--shadow-soft)]" : "size-8",
                    active && !cook && "bg-forest-50",
                  )}
                >
                  <Icon className={cook ? "size-5" : "size-[22px]"} strokeWidth={active ? 2.4 : 2} aria-hidden />
                </span>
                <span className="line-clamp-2 max-w-full px-0.5 text-center break-words">{t(key)}</span>
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
        <span className="font-display text-2xl font-extrabold tracking-tight">{t("app.name")}</span>
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
                  "flex h-11 items-center gap-3 rounded-2xl px-3 text-[15px] font-semibold transition-colors",
                  active ? "bg-forest text-on-accent" : "text-ink-2 hover:bg-sand",
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
