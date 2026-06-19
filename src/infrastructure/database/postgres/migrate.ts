import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

const MIGRATIONS_DIR = path.join(import.meta.dir, "migrations");

async function ensureMigrationsTable(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function runMigrations(pool: Pool): Promise<void> {
  await ensureMigrationsTable(pool);

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".up.sql"))
    .sort();

  for (const file of files) {
    const migrationName = file.replace(".up.sql", "");

    const alreadyRun = await pool.query(
      "SELECT 1 FROM schema_migrations WHERE name = $1",
      [migrationName],
    );

    if (alreadyRun.rowCount && alreadyRun.rowCount > 0) {
      console.log(`Skipping already applied: ${migrationName}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");

    await pool.query("BEGIN");
    try {
      await pool.query(sql);
      await pool.query("INSERT INTO schema_migrations (name) VALUES ($1)", [migrationName]);
      await pool.query("COMMIT");
      console.log(`Applied: ${migrationName}`);
    } catch (err) {
      await pool.query("ROLLBACK");
      console.error(`Failed to apply migration ${migrationName}:`, err);
      throw err;
    }
  }

  console.log("All migrations applied successfully");
}

export async function rollbackMigrations(pool: Pool): Promise<void> {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".down.sql"))
    .sort()
    .reverse();

  for (const file of files) {
    const migrationName = file.replace(".down.sql", "");

    const alreadyRun = await pool.query(
      "SELECT 1 FROM schema_migrations WHERE name = $1",
      [migrationName],
    );

    if (!alreadyRun.rowCount || alreadyRun.rowCount === 0) {
      console.log(`Skipping not applied: ${migrationName}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");

    await pool.query("BEGIN");
    try {
      await pool.query(sql);
      await pool.query("DELETE FROM schema_migrations WHERE name = $1", [migrationName]);
      await pool.query("COMMIT");
      console.log(`Rolled back: ${migrationName}`);
    } catch (err) {
      await pool.query("ROLLBACK");
      console.error(`Failed to rollback migration ${migrationName}:`, err);
      throw err;
    }
  }

  console.log("Rollback completed");
}

// CLI runner
if (import.meta.main) {
  const { createPool, closePool } = await import("./connection.ts");
  const pool = createPool();

  try {
    const command = process.argv[2];
    if (command === "rollback") {
      await rollbackMigrations(pool);
    } else {
      await runMigrations(pool);
    }
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await closePool(pool);
  }
}