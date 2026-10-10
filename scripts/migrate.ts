import { mkdirSync } from "node:fs";
import { migrate } from "drizzle-orm/libsql/migrator";
import { databaseUrl, db } from "@/server/db/client";

export async function runMigrations() {
  if (databaseUrl().startsWith("file:")) mkdirSync(".data", { recursive: true });
  await migrate(db, { migrationsFolder: "drizzle" });
}

if (process.argv[1]?.endsWith("migrate.ts")) {
  runMigrations()
    .then(() => console.log("✓ migrations applied"))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
