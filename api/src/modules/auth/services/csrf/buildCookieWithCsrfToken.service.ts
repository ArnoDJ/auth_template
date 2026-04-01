import { Inject, Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"

@Injectable()
export class BuildCookieWithCsrfTokenService {
  private static readonly developmentEnvironments = new Set([
    "development",
    "test",
  ])

  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService
  ) {}

  public execute(csrfToken: string): string {
    const cookieExpireTime = this.getCookieExpireTime()
    const nodeEnv = this.configService.get<string>("NODE_ENV") ?? "development"
    if (BuildCookieWithCsrfTokenService.developmentEnvironments.has(nodeEnv)) {
      return `_csrf=${csrfToken}; SameSite=Lax; Path=/; Max-Age=${cookieExpireTime}`
    }

    return `_csrf=${csrfToken}; Secure; Path=/; SameSite=None; Max-Age=${cookieExpireTime}`
  }

  private getCookieExpireTime(): number {
    const cookieExpireTime =
      this.configService.get<number>("COOKIE_EXPIRE_TIME")
    return cookieExpireTime ?? 38000
  }
}
