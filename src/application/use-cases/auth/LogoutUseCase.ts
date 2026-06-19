import { IRefreshTokenRepository } from "../../../application/ports/repositories/IRefreshTokenRepository";

export class LogoutUseCase {
  constructor(private refreshRepo: IRefreshTokenRepository) {}

  async execute(userId: string) {
    await this.refreshRepo.revokeAllForUser(userId);
  }
}
