import { Injectable, UnauthorizedException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { RefreshToken } from "../../entities/refreshToken"
import { Repository } from "typeorm"

@Injectable()
export class GetRefreshTokenStateByIdService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>
  ) {}

  public async execute(id: string): Promise<RefreshToken> {
    const refreshTokenState = await this.getRefreshTokenStateByIdAndUserAgent(
      id
    )
    if (!refreshTokenState) {
      throw new UnauthorizedException("not allowed")
    }
    return refreshTokenState
  }

  private async getRefreshTokenStateByIdAndUserAgent(
    id: string
  ): Promise<RefreshToken | null> {
    return await this.refreshTokenRepository.findOne({
      where: { id }
    })
  }
}
