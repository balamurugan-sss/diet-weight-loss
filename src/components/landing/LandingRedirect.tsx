"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store/userStore";

export function LandingRedirect() {
  const hasHydrated = useUserStore((s) => s.hasHydrated);
  const profile = useUserStore((s) => s.profile);
  const router = useRouter();

  useEffect(() => {
    if (hasHydrated && profile) {
      router.replace("/dashboard");
    }
  }, [hasHydrated, profile, router]);

  return null;
}
