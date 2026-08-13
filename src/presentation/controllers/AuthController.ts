import type { NextFunction, Request, Response } from "express";
import { LoginUseCase } from "../../application/use-cases/auth/LoginUseCase";
import { LogoutUseCase } from "../../application/use-cases/auth/LogoutUseCase";
import { RefreshTokenUseCase } from "../../application/use-cases/auth/RefreshTokenUseCase";

export class AuthController {
  constructor(
    private loginUC: LoginUseCase,
    private refreshUC: RefreshTokenUseCase,
    private logoutUC: LogoutUseCase,
  ) { }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await this.loginUC.execute(email, password);
      // set refresh token cookie
      res.cookie("refreshToken", result.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
      res.json({ accessToken: result.accessToken, user: result.user });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const rt = req.cookies?.refreshToken;
      if (!rt) return res.status(400).json({ message: "No refresh token" });
      const tokens = await this.refreshUC.execute(rt);
      res.cookie("refreshToken", tokens.refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
      res.json({ accessToken: tokens.accessToken });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      await this.logoutUC.execute(user.id);
      res.clearCookie('refreshToken');
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}
