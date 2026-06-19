import { RequestHandler } from "express";
import type { Schema } from "valibot";
import { safeParse } from "valibot";

// Generic validator middleware factory
export function validator(schema: Schema): RequestHandler {
	return (req, res, next) => {
		const toValidate = { body: req.body, query: req.query, params: req.params };
		const result = safeParse(schema, toValidate);
		if (!result.success) {
			const errors = result.error.issues.map((i: any) => ({
				path: i.path.join("."),
				message: i.message,
			}));
			return res
				.status(400)
				.json({
					code: "VALIDATION_ERROR",
					message: "Validation failed",
					errors,
				});
		}
		// attach parsed data
		(req as any).validatedBody = result.data.body;
		(req as any).validatedQuery = result.data.query;
		(req as any).validatedParams = result.data.params;
		next();
	};
}
