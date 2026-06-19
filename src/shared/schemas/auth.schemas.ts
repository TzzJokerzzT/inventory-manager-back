import { object, string, pipe, minLength, pattern } from "valibot";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginSchema = object({
	body: object({
		email: pipe(string(), pattern(emailRegex)),
		password: pipe(string(), minLength(8)),
	}),
});

export const RefreshSchema = object({
	body: object({
		refreshToken: pipe(string(), minLength(1)),
	}),
});

export default {
	LoginSchema,
	RefreshSchema,
};
