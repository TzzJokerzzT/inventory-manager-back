import "express";

declare module "express" {
	interface Request {
		validatedBody?: any;
		validatedQuery?: any;
		validatedParams?: any;
		user?: any;
	}
}
