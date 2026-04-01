import { Inject, Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"

@Injectable()
export class BuildCookieWithRefreshTokenService {
  private static readonly developmentEnvironments = new Set([
    "development",
    "test",
  ])

  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService
  ) {}

  public execute(refreshToken: string): string {
    const cookieExpireTime =
      this.configService.get<string>("COOKIE_EXPIRE_TIME")
    const nodeEnv = this.configService.get<string>("NODE_ENV") ?? "development"
    const maxAge = cookieExpireTime ?? 3800
    if (
      BuildCookieWithRefreshTokenService.developmentEnvironments.has(nodeEnv)
    ) {
      return `refreshToken=${refreshToken}; HttpOnly; SameSite=Lax; Path=/auth/refresh_token; Max-Age=${maxAge}`
    }

    return `refreshToken=${refreshToken}; HttpOnly; Secure; Path=/auth/refresh_token; SameSite=None; Max-Age=${maxAge}`
  }
}
