import { Pool } from "pg";
import { PasswordService } from "../services/PasswordService";
import { JwtService } from "../services/JwtService";
import { UserRepository } from "../database/repositories/UserRepository";
import { RefreshTokenRepository } from "../database/repositories/RefreshTokenRepository";
import { LoginUseCase } from "../../application/use-cases/auth/LoginUseCase";
import { RefreshTokenUseCase } from "../../application/use-cases/auth/RefreshTokenUseCase";
import { LogoutUseCase } from "../../application/use-cases/auth/LogoutUseCase";
import { AuthController } from "../../presentation/controllers/AuthController";

// Manual composition root
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const passwordService = new PasswordService();
const refreshRepo = new RefreshTokenRepository(pool);
const jwtService = new JwtService(refreshRepo);
const userRepo = new UserRepository(pool as any);

const loginUC = new LoginUseCase(
	userRepo,
	passwordService,
	jwtService,
	refreshRepo,
);
const refreshUC = new RefreshTokenUseCase(refreshRepo, jwtService);
const logoutUC = new LogoutUseCase(refreshRepo);

const authController = new AuthController(loginUC, refreshUC, logoutUC);

export {
	pool,
	passwordService,
	jwtService,
	userRepo,
	refreshRepo,
	loginUC,
	refreshUC,
	logoutUC,
	authController,
};
