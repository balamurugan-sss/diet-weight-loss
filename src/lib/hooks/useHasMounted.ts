import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * True only after client-side hydration. Uses useSyncExternalStore (server
 * snapshot = false, client snapshot = true) instead of useEffect+setState so
 * the mount flip doesn't trigger the set-state-in-effect lint rule.
 */
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
