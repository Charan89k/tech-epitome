/**
 * Which sign-in page a protected path belongs to. Each product has its own
 * entry point; this only chooses a page, it grants nothing. Edge-safe: the
 * proxy imports it.
 */
const CAMPUS_PREFIXES = ["/campus", "/interviews", "/prepare", "/roadmaps"];

const within = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export function isPortalLoginPath(pathname: string): boolean {
  return within(pathname, "/campus/login") || pathname === "/admin/login";
}

export function loginPathFor(pathname: string): string {
  if (within(pathname, "/admin")) return "/admin/login";
  if (CAMPUS_PREFIXES.some((prefix) => within(pathname, prefix)))
    return "/campus/login";
  return "/login";
}
