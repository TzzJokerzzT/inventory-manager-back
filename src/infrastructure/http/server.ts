import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import { pool } from "../di/container";

export function createApp() {
	const app = express();

	app.use(helmet());
	app.use(cors({ origin: process.env.CORS_ORIGIN ?? true, credentials: true }));
	app.use(morgan("tiny"));
	app.use(express.json());
	app.use(cookieParser());

	// expose pool globally for simple factories (used by legacy factories)
	(global as any).__dbPool = pool;

	app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

	app.use("/api/auth", authRoutes);

	// basic error handler
	app.use((err: any, _req: any, res: any, _next: any) => {
		console.error(err);
		const status = err?.statusCode ?? 500;
		res
			.status(status)
			.json({ message: err?.message ?? "Internal server error" });
	});

	return app;
}

export default createApp;
