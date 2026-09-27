/**
 * Stub for the `server-only` package under test.
 *
 * The real module throws on import outside a React Server Component, which
 * is exactly what it is for - but it means a plain unit test of a service or
 * a lib module cannot import it at all. Aliasing it to an empty module in
 * vitest.config.mts keeps the production guarantee intact while letting the
 * logic underneath be tested directly.
 */
export {};
