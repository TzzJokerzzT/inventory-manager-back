import { IUserRepository } from "../../../application/ports/repositories/IUserRepository";
import { IPasswordService } from "../../../application/ports/services/IPasswordService";
import { IJwtService } from "../../../application/ports/services/IJwtService";
import { IRefreshTokenRepository } from "../../../application/ports/repositories/IRefreshTokenRepository";
import { Email } from "../../../domain/value-objects/Email";

export class LoginUseCase {
  constructor(
    private users: IUserRepository,
    private passwordService: IPasswordService,
    private jwtService: IJwtService,
    private refreshRepo: IRefreshTokenRepository,
  ) {}

  async execute(email: string, password: string) {
    const u = await this.users.findByEmail(email);
    if (!u) throw new Error("Invalid credentials");
    const match = await this.passwordService.compare(password, u.passwordHash);
    if (!match) throw new Error("Invalid credentials");

    const accessToken = await this.jwtService.sign({ userId: u.id }, { expiresIn: process.env.JWT_ACCESS_EXPIRATION });
    const refreshToken = await this.jwtService.sign({ userId: u.id }, { expiresIn: process.env.JWT_REFRESH_EXPIRATION });

    // Store refresh token hash (store token directly here; repo will store hash)
    await this.refreshRepo.create({ userId: u.id, tokenHash: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) });

    return { accessToken, refreshToken, user: { id: u.id, email: u.email.toString(), name: u.name, roleId: u.roleId } };
  }
}
