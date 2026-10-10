"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteCardioAction } from "@/server/actions/cardio";

export function CardioDeleteButton({ id, label }: { id: string; label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label={label}
      disabled={pending}
      onClick={() =>
        start(async () => {
          if ((await deleteCardioAction(id)).ok) router.refresh();
        })
      }
      className="grid size-10 place-items-center rounded-full text-muted hover:bg-sand hover:text-terracotta disabled:opacity-40"
    >
      <Trash2 className="size-4" aria-hidden />
    </button>
  );
}
