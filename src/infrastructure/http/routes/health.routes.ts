import { Router } from "express";
import type { Pool } from "pg";

export function createHealthRouter(pool: Pool): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  router.get("/ready", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ok", database: "connected" });
    } catch {
      res.status(503).json({ status: "error", database: "disconnected" });
    }
  });

  return router;
}