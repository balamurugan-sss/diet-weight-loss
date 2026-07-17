"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store/userStore";

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const hasHydrated = useUserStore((s) => s.hasHydrated);
  const profile = useUserStore((s) => s.profile);
  const router = useRouter();

  useEffect(() => {
    if (hasHydrated && !profile) {
      router.replace("/onboarding");
    }
  }, [hasHydrated, profile, router]);

  if (!hasHydrated || !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return <>{children}</>;
}
