import jwt from "jsonwebtoken";
import type { IJwtService } from "../../application/ports/services/IJwtService";
import type { IRefreshTokenRepository } from "../../application/ports/repositories/IRefreshTokenRepository";
import { randomUUID } from "node:crypto";

export class JwtService implements IJwtService {
  constructor(private refreshRepo: IRefreshTokenRepository) {}

  async sign(payload: object, opts?: { expiresIn?: string }): Promise<string> {
    const secret = process.env.JWT_ACCESS_SECRET as string;
    return jwt.sign(payload, secret, { expiresIn: opts?.expiresIn || process.env.JWT_ACCESS_EXPIRATION || "15m" });
  }

  async verify<T>(token: string): Promise<T> {
    const secret = process.env.JWT_ACCESS_SECRET as string;
    return jwt.verify(token, secret) as T;
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshSecret = process.env.JWT_REFRESH_SECRET as string;
    const payload = jwt.verify(refreshToken, refreshSecret) as { userId: string; jti?: string };

    const tokenHash = refreshToken;
    const record = await this.refreshRepo.findByHash(tokenHash);
    if (!record || record.revoked) {
      throw new Error("Invalid refresh token");
    }

    await this.refreshRepo.revoke(record.id);

    const accessToken = await this.sign({ userId: payload.userId }, { expiresIn: process.env.JWT_ACCESS_EXPIRATION });
    const newRefresh = jwt.sign({ userId: payload.userId, jti: randomUUID() }, refreshSecret, { expiresIn: process.env.JWT_REFRESH_EXPIRATION || "7d" });

    await this.refreshRepo.create({ userId: payload.userId, tokenHash: newRefresh, expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) });

    return { accessToken, refreshToken: newRefresh };
  }
}
