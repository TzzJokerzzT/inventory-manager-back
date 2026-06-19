import { Router } from "express";
import { authController, pool } from "../../di/container";
import { validator } from "../middleware/validator.middleware";
import {
	publicLimiter,
	authLimiter,
} from "../middleware/rate-limiter.middleware";
import schemas from "../../../shared/schemas/auth.schemas";
import { authMiddlewareFactory } from "../middleware/auth.middleware";

const router = Router();

router.post(
	"/login",
	publicLimiter,
	validator(schemas.LoginSchema),
	(req, res, next) => authController.login(req, res, next),
);
router.post("/refresh", publicLimiter, (req, res, next) =>
	authController.refresh(req, res, next),
);
router.post(
	"/logout",
	authMiddlewareFactory(pool),
	authLimiter,
	(req, res, next) => authController.logout(req, res, next),
);

export default router;
