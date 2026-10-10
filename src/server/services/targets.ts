import "server-only";
import { toHealthInput } from "@/lib/profile/health";
import { computeTargets, type Targets } from "@/lib/nutrition/targets";
import type { Profile } from "@/server/auth/dal";

export function targetsForProfile(profile: Profile): Targets | null {
  const input = toHealthInput(profile);
  return input ? computeTargets(input) : null;
}
