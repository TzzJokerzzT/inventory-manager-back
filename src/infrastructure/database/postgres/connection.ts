import { Pool, type PoolConfig } from "pg";

let poolInstance: Pool | null = null;

export function createPool(config?: Partial<PoolConfig>): Pool {
  if (poolInstance) {
    return poolInstance;
  }

  const poolConfig: PoolConfig = {
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 2_000,
    ...config,
  };

  poolInstance = new Pool(poolConfig);

  poolInstance.on("error", (err: Error) => {
    console.error("Unexpected pool error:", err);
  });

  poolInstance.on("connect", () => {
    console.log("Database connection established");
  });

  return poolInstance;
}

export async function closePool(pool: Pool): Promise<void> {
  try {
    await pool.end();
    poolInstance = null;
    console.log("Database connection pool closed");
  } catch (err) {
    console.error("Error closing database pool:", err);
    throw err;
  }
}

export { Pool };