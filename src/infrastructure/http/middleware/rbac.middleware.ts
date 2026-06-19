import { Request, Response, NextFunction } from "express";

export function rbacMiddleware(allowed: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (allowed.includes(user.roleId)) return next();
    return res.status(403).json({ message: "Forbidden" });
  };
}
