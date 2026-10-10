import { mkdirSync } from "node:fs";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

export type DB = LibSQLDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __libsql?: Client; __db?: DB };

// TURSO_* are the names set by Vercel's Turso integration.
export function databaseUrl() {
  return process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || "file:./.data/app.db";
}

export function databaseAuthToken() {
  return process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || undefined;
}

const MISCONFIGURED =
  "DATABASE_URL is missing or points to a local file. On Vercel set DATABASE_URL (libsql://…turso.io) and DATABASE_AUTH_TOKEN in Project → Settings → Environment Variables, then redeploy. See docs/DEPLOYMENT.md.";

function makeClient(): Client {
  // Serverless hosts (Vercel) have a read-only filesystem, so the SQLite fallback can't work there.
  // Fail on first use rather than at import, so error pages still render and the logs say why.
  if (process.env.VERCEL && databaseUrl().startsWith("file:")) {
    const fail = () => {
      throw new Error(MISCONFIGURED);
    };
    // Drizzle reads properties while wiring up; only calling a method fails.
    return new Proxy({} as Client, { get: (_, prop) => (prop === "then" ? undefined : fail) });
  }
  if (databaseUrl().startsWith("file:./.data")) mkdirSync(".data", { recursive: true });
  const client = createClient({
    url: databaseUrl(),
    authToken: databaseAuthToken(),
  });
  // SQLite leaves FK enforcement off per connection; cascades depend on it.
  void client.execute("PRAGMA foreign_keys = ON").catch(() => {});
  return client;
}

export const libsql = globalForDb.__libsql ?? makeClient();
export const db: DB = globalForDb.__db ?? drizzle(libsql, { schema });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__libsql = libsql;
  globalForDb.__db = db;
}

export { schema };
