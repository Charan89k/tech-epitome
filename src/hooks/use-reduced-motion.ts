import * as React from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

/**
 * True when the operating system asks for reduced motion.
 *
 * Visualizations read this to snap between frames instead of tweening, and
 * to refuse to autoplay. The CSS media query in globals.css covers
 * transitions; this covers behaviour, which CSS cannot express.
 *
 * Read during render via useSyncExternalStore so the first paint is already
 * correct rather than animating for one frame and then stopping.
 */
export function usePrefersReducedMotion(): boolean {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => false);
}
