import { Injectable, Inject } from "@nestjs/common"
import { GetUserByIdService } from "../../../users/services/users/getUserById.service"
import { InjectRepository } from "@nestjs/typeorm"
import { RefreshToken } from "../../entities/refreshToken"
import { Repository } from "typeorm"

@Injectable()
export class FindOrCreateRefreshTokenStateService {
  constructor(
    @Inject(GetUserByIdService)
    private readonly getUserByIdService: GetUserByIdService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>
  ) {}

  public async execute(
    userId: string,
    userAgent: string
  ): Promise<RefreshToken> {
    const user = await this.getUserByIdService.execute(userId)
    const existingRefreshTokenState = await this.getRefreshTokenStateByUserIdAndAgent(
      user.id,
      userAgent
    )
    if (!existingRefreshTokenState) {
      return await this.createRefreshToken(userId, userAgent)
    }

    const nextTokenVersion = existingRefreshTokenState.tokenVersion + 1
    await this.refreshTokenRepository.update(
      { id: existingRefreshTokenState.id },
      {
        revoked: false,
        tokenVersion: nextTokenVersion,
        updatedAt: new Date()
      }
    )

    const updatedRefreshTokenState = await this.getRefreshTokenStateByUserIdAndAgent(
      user.id,
      userAgent
    )
    if (!updatedRefreshTokenState) {
      return await this.createRefreshToken(userId, userAgent)
    }
    return updatedRefreshTokenState
  }

  private async getRefreshTokenStateByUserIdAndAgent(
    userId: string,
    userAgent: string
  ): Promise<RefreshToken | null> {
    return await this.refreshTokenRepository.findOne({
      where: { userId, userAgent }
    })
  }

  private async createRefreshToken(
    userId: string,
    userAgent: string
  ): Promise<RefreshToken> {
    return await this.refreshTokenRepository.save({
      userAgent,
      userId,
      revoked: false,
      tokenVersion: 0
    })
  }
}
