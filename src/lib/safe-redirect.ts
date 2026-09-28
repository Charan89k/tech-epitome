/**
 * Redirect targets that cannot leave this origin.
 *
 * `?next=` and the `next` form field are attacker-controlled: anyone can send
 * a learner a link to our own login page carrying someone else's destination.
 * Left unchecked that is an open redirect — the victim sees the Tech Epitome
 * domain, signs in, and lands somewhere else entirely.
 *
 * The test is a positive one against a narrow shape rather than a list of bad
 * forms, because the bad forms are not enumerable by inspection:
 *
 *   //evil.example      protocol-relative, the obvious one
 *   /\evil.example      WHATWG treats a backslash as a slash in a special
 *                       scheme, so this resolves exactly like the above
 *   /\t/evil.example    browsers strip tab, newline and carriage return from
 *   /\n/evil.example    a URL *before* parsing it, so these collapse to `//`
 *
 * A blocklist that rejects `//` alone lets all but the first through. The
 * allowlist below admits only characters that are legal in a path, query or
 * fragment, which excludes backslash and every control character by omission.
 * `//` is still rejected explicitly: it is made of legal characters.
 *
 * `src/services/notifications.ts` applies the same shape to stored hrefs, with
 * different semantics (null rather than a fallback) for a different caller.
 */
const PATH_ONLY = /^\/[A-Za-z0-9\-._~!$&'()*+,;=:@%/?#[\]]*$/;

/**
 * Narrows an untrusted redirect target to a same-origin absolute path.
 *
 * Accepts the shapes Next.js hands over — a string, the first entry of a
 * repeated search param, or a `FormDataEntryValue` — and returns `fallback`
 * for anything else. Callers choose their own fallback because they differ:
 * login lands on the dashboard, signup returns an empty string so a brand-new
 * account goes to onboarding instead.
 */
export function safeInternalPath(value: unknown, fallback: string): string {
  const next = Array.isArray(value) ? value[0] : value;
  if (typeof next !== "string" || next.length === 0) return fallback;
  if (!PATH_ONLY.test(next) || next.startsWith("//")) return fallback;
  return next;
}
