import type { Request, Response } from "express";
import cors from "cors";

export function createCorsMiddleware() {
  const allowedOrigins = process.env.CORS_ORIGIN?.split(",").map((o) => o.trim()) ?? [
    "http://localhost:3000",
  ];

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
}