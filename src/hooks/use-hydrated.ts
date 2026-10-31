import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False in the server render and until React has hydrated this component,
 * true afterwards. Controls that would silently drop or garble input before
 * hydration (a click with no handler yet, typing into a textarea React then
 * overwrites) use it to stay disabled until they can respond.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
