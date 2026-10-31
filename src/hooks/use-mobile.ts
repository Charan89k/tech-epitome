import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

/**
 * True when the viewport is below the mobile breakpoint.
 *
 * Uses `useSyncExternalStore` rather than a state-plus-effect pair. The
 * effect version starts as `false` on the client for one frame before the
 * effect corrects it, which makes the sidebar flash from desktop to mobile
 * layout on a phone. This reads the media query during render instead, so
 * the first paint is already correct.
 *
 * The server snapshot is `serverGuess` (default `false`, desktop-first).
 * React uses it again while hydrating, so a page whose layout differs by
 * breakpoint should pass the server's guess from the request (see
 * `isLikelyMobileRequest`); otherwise a phone hydrates the desktop layout
 * and then swaps to the mobile one, remounting everything inside it.
 */
export function useIsMobile(serverGuess = false): boolean {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => serverGuess);
}
