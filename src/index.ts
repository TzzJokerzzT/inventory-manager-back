import { createPool, closePool } from "./infrastructure/database/postgres/connection.ts";
import { createApp } from "./infrastructure/http/server.ts";
import type { AppDependencies } from "./infrastructure/http/server.ts";

const PORT = Number.parseInt(process.env.PORT ?? "4000", 10);

async function start(): Promise<void> {
  const pool = createPool();

  // Verify database connection
  try {
    await pool.query("SELECT 1");
    console.log("Database connection verified");
  } catch (err) {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  }

  const deps: AppDependencies = { pool };
  const app = createApp(deps);

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`${signal} received. Shutting down...`);

    // Stop accepting new connections
    server.close(() => {
      console.log("HTTP server closed");
    });

    // Force exit after 30 seconds
    const forceExitTimer = setTimeout(() => {
      console.error("Forced shutdown after timeout");
      process.exit(1);
    }, 30_000);

    // Close database pool
    try {
      await closePool(pool);
    } catch (err) {
      console.error("Error closing database pool:", err);
    }

    clearTimeout(forceExitTimer);
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});