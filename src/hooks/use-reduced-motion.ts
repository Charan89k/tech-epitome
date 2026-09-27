import * as React from "react";

const QUERY = "(prefers-reduced-motion: reduce)";
/** Set on <body> by the app shell from the learner's saved preference. */
const ATTRIBUTE = "data-reduced-motion";

function prefersReduced(): boolean {
  if (typeof window === "undefined") return false;
  // Either signal is enough. The OS setting is authoritative and cannot be
  // overridden by the app — somebody who asked their system for less motion
  // has asked everything on it, including us.
  if (window.matchMedia(QUERY).matches) return true;
  return document.body.getAttribute(ATTRIBUTE) === "true";
}

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);

  // The attribute changes when a saved preference arrives with a new
  // render, so the store has to watch it too — otherwise saving the
  // setting appears to do nothing until a full reload.
  const observer = new MutationObserver(onChange);
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: [ATTRIBUTE],
  });

  return () => {
    mql.removeEventListener("change", onChange);
    observer.disconnect();
  };
}

/**
 * True when the learner has asked for reduced motion, by either route.
 *
 * Two sources, OR-ed: the operating system's `prefers-reduced-motion`
 * media query, and the account setting, which the app shell writes onto
 * `<body data-reduced-motion>`. The account setting exists because the OS
 * one is all-or-nothing across every site, and somebody may want a still
 * visualization here without turning off animation everywhere.
 *
 * Visualizations read this to snap between frames instead of tweening, and
 * to refuse to autoplay. The CSS media query in globals.css covers
 * transitions; this covers behaviour, which CSS cannot express.
 *
 * Read during render via useSyncExternalStore so the first paint is already
 * correct rather than animating for one frame and then stopping.
 */
export function usePrefersReducedMotion(): boolean {
  return React.useSyncExternalStore(subscribe, prefersReduced, () => false);
}
