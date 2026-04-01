import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { RefreshToken } from "../../entities/refreshToken"

@Injectable()
export class RevokeAllRefreshTokensForUserService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>
  ) {}

  public async execute(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, revoked: false },
      {
        revoked: true,
        updatedAt: new Date()
      }
    )
  }
}
