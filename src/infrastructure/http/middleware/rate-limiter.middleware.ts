import rateLimit from "express-rate-limit";

const WINDOW_MS = Number.parseInt(
	process.env.RATE_LIMIT_WINDOW_MS ?? "900000",
	10,
);
const MAX_PUBLIC = Number.parseInt(
	process.env.RATE_LIMIT_MAX_PUBLIC ?? "20",
	10,
);
const MAX_AUTH = Number.parseInt(process.env.RATE_LIMIT_MAX_AUTH ?? "1000", 10);

export const publicLimiter = rateLimit({
	windowMs: WINDOW_MS,
	max: MAX_PUBLIC,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		code: "TOO_MANY_REQUESTS",
		message: "Too many requests, slow down",
	},
});

export const authLimiter = rateLimit({
	windowMs: WINDOW_MS,
	max: MAX_AUTH,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		code: "TOO_MANY_REQUESTS",
		message: "Too many requests, slow down",
	},
});

export default { publicLimiter, authLimiter };
