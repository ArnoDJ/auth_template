import { Injectable, Inject } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { RefreshToken } from "../../entities/refreshToken"
import { GetRefreshTokenStateByUserAndAgentService } from "./getRefreshTokenByUserAndAgent.service"

@Injectable()
export class LogoutService {
  constructor(
    @Inject(GetRefreshTokenStateByUserAndAgentService)
    private readonly getRefreshTokenStateByUserAndAgentService: GetRefreshTokenStateByUserAndAgentService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>
  ) {}

  public async execute(userId: string, userAgent: string): Promise<void> {
    const refreshTokenState =
      await this.getRefreshTokenStateByUserAndAgentService.execute(
        userId,
        userAgent
      )
    await this.refreshTokenRepository.update(
      { id: refreshTokenState.id },
      {
        ...refreshTokenState,
        revoked: true,
        updatedAt: new Date()
      }
    )
  }
}
