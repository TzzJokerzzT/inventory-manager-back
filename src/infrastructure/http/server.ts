import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import type { Pool } from "pg";
import { createCorsMiddleware } from "./middleware/cors.ts";
import { createHelmetMiddleware } from "./middleware/helmet.ts";
import { createErrorHandler } from "./middleware/error-handler.ts";
import { createHealthRouter } from "./routes/health.routes.ts";

export interface AppDependencies {
  pool: Pool;
  // Repositories, services, and controllers will be added in later slices
}

export function createApp(deps: AppDependencies): express.Application {
  const app = express();

  // Trust proxy (for rate limiting behind reverse proxy)
  app.set("trust proxy", 1);

  // Global middleware (order matters)
  app.use(createCorsMiddleware());
  app.use(createHelmetMiddleware());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan("combined"));

  // Health check routes (before rate limiter)
  app.use("/api/health", createHealthRouter(deps.pool));

  // API routes will be mounted here in later slices
  // app.use("/api/auth", authRouter(deps));
  // app.use("/api/products", productsRouter(deps));
  // app.use("/api/movements", movementsRouter(deps));
  // app.use("/api/purchases", purchasesRouter(deps));
  // app.use("/api/suppliers", suppliersRouter(deps));
  // app.use("/api/reports", reportsRouter(deps));
  // app.use("/api/users", usersRouter(deps));

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: "NOT_FOUND", message: "Route not found" });
  });

  // Global error handler (must be last)
  app.use(createErrorHandler());

  return app;
}