import { IRefreshTokenRepository } from "../../../application/ports/repositories/IRefreshTokenRepository";
import { IJwtService } from "../../../application/ports/services/IJwtService";

export class RefreshTokenUseCase {
  constructor(private refreshRepo: IRefreshTokenRepository, private jwtService: IJwtService) {}

  async execute(refreshToken: string) {
    // jwtService.refresh will handle verification, revocation, and storing new token
    return this.jwtService.refresh(refreshToken);
  }
}
