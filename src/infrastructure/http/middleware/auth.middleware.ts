import { Request, Response, NextFunction } from "express";
import { JwtService } from "../../services/JwtService";
import type { Pool } from "pg";
import { UserRepository } from "../database/repositories/UserRepository";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export function authMiddlewareFactory(db: Pool) {
  const userRepo = new UserRepository(db as any);
  const jwtService = new JwtService({} as any);

  return async function auth(req: Request, _res: Response, next: NextFunction) {
    try {
      const header = req.headers.authorization;
      if (!header) return next();
      const token = header.replace(/^Bearer /i, "");
      const payload = await jwtService.verify<{ userId: string }>(token);
      if (!payload?.userId) return next();
      const user = await userRepo.findById((payload as any).userId);
      if (!user) return next();
      req.user = { id: user.id, roleId: user.roleId };
      next();
    } catch (err) {
      // ignore invalid tokens — downstream can enforce auth
      next();
    }
  };
}
