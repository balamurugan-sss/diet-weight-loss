"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import { sectionFor } from "./nav";

/** Segmented tabs across the top of a section (Meals: Plan · Recipes · Cook · Shopping, …). */
export function SectionTabs() {
  const path = usePathname();
  const { t } = useI18n();
  const hit = sectionFor(path);
  if (!hit) return null;
  return (
    <nav aria-label={t(hit.section.key)} className="no-print no-scrollbar -mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="inline-flex min-w-max gap-1 rounded-xl border border-line bg-surface p-1">
        {hit.section.items.map(({ href, key, icon: Icon }) => {
          const active = hit.active === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "font-display inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3.5 text-[15px] font-bold tracking-wide uppercase transition-colors",
                  active ? "bg-forest text-on-accent" : "text-muted hover:text-charcoal",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
