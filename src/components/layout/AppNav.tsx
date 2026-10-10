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
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const { href, key, icon: Icon, primary } = item;
          const active = isNavActive(item, path);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "font-display flex min-h-16 flex-col items-center justify-center gap-0.5 text-[12px] leading-tight font-bold tracking-wider uppercase",
                  active ? "text-forest" : "text-muted",
                )}
              >
                <span
                  className={cn(
                    "grid place-items-center transition-colors",
                    primary ? "size-11 -skew-x-6 rounded-lg bg-lime text-[#0a0c0e] shadow-[var(--shadow-soft)]" : "size-8 rounded-lg",
                    active && !primary && "bg-forest-50",
                    active && primary && "ring-2 ring-forest ring-offset-2 ring-offset-surface",
                  )}
                >
                  <Icon className={cn(primary ? "size-5.5 skew-x-6" : "size-[22px]")} strokeWidth={active || primary ? 2.5 : 2} aria-hidden />
                </span>
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
        <span className="font-display text-[1.7rem] font-extrabold tracking-wide uppercase">{t("app.name")}</span>
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
                  "font-display flex h-11 items-center gap-3 rounded-lg px-3 text-[17px] font-bold tracking-wide uppercase transition-colors",
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
