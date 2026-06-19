import type { ErrorRequestHandler, Request, Response } from "express";
import { AppError } from "../../../shared/errors/AppError.ts";

export function createErrorHandler(): ErrorRequestHandler {
  return (err: Error, req: Request, res: Response, _next: unknown) => {
    if (err instanceof AppError) {
      const response: Record<string, unknown> = {
        error: err.code,
        message: err.message,
      };

      if (err.details) {
        response.details = err.details;
      }

      if (process.env.NODE_ENV === "development") {
        response.stack = err.stack;
      }

      return res.status(err.statusCode).json(response);
    }

    // Unexpected errors — never leak internals in production
    console.error("Unhandled error:", err);

    const response: Record<string, unknown> = {
      error: "INTERNAL_ERROR",
      message:
        process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
    };

    if (process.env.NODE_ENV === "development") {
      response.stack = err.stack;
    }

    return res.status(500).json(response);
  };
}