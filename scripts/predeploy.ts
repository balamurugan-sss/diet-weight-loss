/**
 * Runs before `next build` on Vercel (the `vercel-build` script): checks the
 * database settings and applies migrations + the recipe catalogue to the
 * production database. Both steps are idempotent, so every deploy runs them.
 *
 *   npx tsx scripts/predeploy.ts
 */
// The database modules are imported only after the settings are checked, so a
// misconfiguration produces the explanation below rather than a stack trace.
const databaseUrl = () => process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || "file:./.data/app.db";

function fail(lines: string[]): never {
  console.error(["", "✗ Deployment database is not configured", ...lines.map((l) => `  ${l}`), ""].join("\n"));
  process.exit(1);
}

async function main() {
  const url = databaseUrl();
  const serverless = !!process.env.VERCEL;
  if (serverless && !process.env.DATABASE_URL && !process.env.TURSO_DATABASE_URL) {
    fail([
      "DATABASE_URL is not set. Vercel functions have a read-only filesystem, so the local SQLite",
      "fallback (file:./.data/app.db) cannot work there.",
      "Create a Turso database and add these in Vercel → Project → Settings → Environment Variables:",
      "  DATABASE_URL=libsql://<db>-<org>.turso.io",
      "  DATABASE_AUTH_TOKEN=<token from `turso db tokens create <db>`>",
      "then redeploy.",
    ]);
  }
  if (serverless && url.startsWith("file:")) {
    fail([`DATABASE_URL is a local file (${url}). On Vercel use a Turso libsql:// URL (see docs/DEPLOYMENT.md).`]);
  }
  if (url.startsWith("libsql://") && !process.env.DATABASE_AUTH_TOKEN && !process.env.TURSO_AUTH_TOKEN) {
    console.warn("⚠ DATABASE_AUTH_TOKEN is empty — Turso usually requires one.");
  }

  const started = Date.now();
  const { importCatalogue } = await import("./import-recipes");
  const res = await importCatalogue({ quiet: true });
  console.log(`✓ database ready: migrations applied, ${res.valid} recipes (${res.imported} imported/updated) in ${Math.round((Date.now() - started) / 1000)} s`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    fail([
      `Could not prepare the database at ${databaseUrl().replace(/\/\/.*@/, "//***@")}:`,
      // Drizzle wraps driver errors; the cause holds the useful part (auth, DNS, …).
      String((e as { cause?: { message?: string } })?.cause?.message ?? (e instanceof Error ? e.message.split("\n")[0] : e)),
      "Check DATABASE_URL / DATABASE_AUTH_TOKEN in the Vercel project settings.",
    ]);
  });
