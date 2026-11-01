/*
 * SQL playground worker, on PGlite (PostgreSQL compiled to WebAssembly).
 *
 * The database lives in this worker's memory and nowhere else: no query reaches
 * a server, and closing the tab discards it. The runner terminates the worker
 * to stop a runaway query, then starts a fresh one.
 *
 * Served with the trace workers' Content-Security-Policy (see src/proxy.ts),
 * which allows WebAssembly and the runtime CDN and nothing else on the network.
 * The version is pinned, and a test holds it equal to the package in devDependencies.
 */
const PGLITE_VERSION = "0.5.9";
const PGLITE_URL = `https://cdn.jsdelivr.net/npm/@electric-sql/pglite@${PGLITE_VERSION}/dist/index.js`;

let db = null;

async function start(schema) {
  const { PGlite } = await import(PGLITE_URL);
  db = await PGlite.create();
  await db.exec(schema);
}

async function run(sql) {
  const results = await db.exec(sql);
  return results.map((result) => ({
    fields: result.fields.map((field) => field.name),
    rows: result.rows.map((row) =>
      result.fields.map((field) => {
        const value = row[field.name];
        if (value === null || value === undefined) return null;
        return typeof value === "object" ? JSON.stringify(value) : String(value);
      })
    ),
    affectedRows: result.affectedRows ?? 0,
  }));
}

self.onmessage = async ({ data }) => {
  const { id, type, sql } = data;
  try {
    if (type === "start") {
      await start(sql);
      self.postMessage({ id, ok: true, results: [] });
    } else {
      self.postMessage({ id, ok: true, results: await run(sql) });
    }
  } catch (error) {
    self.postMessage({ id, ok: false, error: String(error?.message ?? error) });
  }
};
