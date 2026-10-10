import { mkdirSync } from "node:fs";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

export type DB = LibSQLDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __libsql?: Client; __db?: DB };

export function databaseUrl() {
  return process.env.DATABASE_URL || "file:./.data/app.db";
}

function makeClient() {
  if (databaseUrl().startsWith("file:./.data")) mkdirSync(".data", { recursive: true });
  const client = createClient({
    url: databaseUrl(),
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
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
