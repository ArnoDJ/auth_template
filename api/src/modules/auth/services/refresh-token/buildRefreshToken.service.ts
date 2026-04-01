import { Inject, Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { JwtService } from "@nestjs/jwt"
import { RefreshToken } from "../../entities/refreshToken"

@Injectable()
export class BuildRefreshTokenService {
  constructor(
    @Inject(JwtService)
    private readonly jwtService: JwtService,
    @Inject(ConfigService)
    private readonly configService: ConfigService
  ) {}

  public async execute(refreshToken: RefreshToken): Promise<string> {
    const refreshTokenExpireTime = this.configService.get<number>(
      "JWT_REFRESH_TOKEN_EXPIRE_TIME"
    )
    const refreshTokenSecret = this.configService.getOrThrow<string>(
      "JWT_REFRESH_SECRET"
    )
    const payload = this.buildJwtPayload(refreshToken)
    return await this.jwtService.signAsync(payload, {
      secret: refreshTokenSecret,
      expiresIn: `${refreshTokenExpireTime ?? 604800}s`
    })
  }

  private buildJwtPayload(refreshToken: RefreshToken): { sub: string; v: number } {
    return { sub: refreshToken.id, v: refreshToken.tokenVersion }
  }
}
