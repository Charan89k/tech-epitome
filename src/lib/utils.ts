export { cn } from "cn"

/**
 * Casts a runtime-built path to Next's typed `Route`.
 *
 * `typedRoutes` verifies literal hrefs at compile time, which is what we want
 * for hand-written links. Paths that come from data - navigation config, a
 * problem slug, a chapter from the database - cannot be verified that way.
 * Rather than scatter `as Route` casts, they funnel through here, and a test
 * asserts that every static nav href resolves to a real route.
 */
export function route(href: string): import("next").Route {
  return href as import("next").Route;
}
