"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/cn";
import { sectionFor } from "./nav";

/** Segmented control across the top of a section (Meal plan | Shopping list, …). */
export function SectionTabs() {
  const path = usePathname();
  const { t } = useI18n();
  const hit = sectionFor(path);
  if (!hit) return null;
  return (
    <nav aria-label={t(hit.section.key)} className="no-print mb-5">
      <ul className="flex gap-1 rounded-md bg-sand p-1">
        {hit.section.items.map(({ href, key }) => {
          const active = hit.active === href;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-10 items-center justify-center rounded-[5px] px-3 text-[15px] font-semibold transition-colors",
                  active ? "bg-sand-2 text-charcoal shadow-[var(--shadow-soft)]" : "text-muted hover:text-charcoal",
                )}
              >
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
