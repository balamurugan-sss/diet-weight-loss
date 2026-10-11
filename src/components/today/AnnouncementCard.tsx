"use client";

import { Megaphone, X } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { dismissAnnouncementAction } from "@/server/actions/notifications";

/** A message from Movewell (offer, news) at the top of My program, until dismissed. */
export function AnnouncementCard({ id, title, body, link }: { id: string; title: string; body: string; link: string | null }) {
  const { t } = useI18n();
  const [hidden, setHidden] = useState(false);
  const [, start] = useTransition();
  if (hidden) return null;
  const external = link?.startsWith("https://");
  return (
    <aside aria-label={title} className="relative flex gap-3 rounded-md border-l-4 border-tag bg-surface p-4 pr-12">
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-tag text-white">
        <Megaphone className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="font-bold">{title}</p>
        <p className="text-[15px] text-ink-2">{body}</p>
        {link && (
          <Link href={link} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="mt-1.5 inline-block font-semibold text-lime">
            {t("announce.open")} →
          </Link>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          setHidden(true);
          start(() => dismissAnnouncementAction(id).then(() => undefined));
        }}
        className="absolute top-2 right-2 grid size-10 place-items-center text-muted"
        aria-label={t("announce.dismiss")}
      >
        <X className="size-5" aria-hidden />
      </button>
    </aside>
  );
}
