import { Inject, Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { createHmac, randomBytes } from "crypto"

@Injectable()
export class BuildCsrfTokenService {
  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService
  ) {}

  public execute(): string {
    const sessionId = randomBytes(64).toString("hex")
    const cookieExpireTime = this.getCookieExpireTime()
    const expiresAt = Math.floor(Date.now() / 1000) + cookieExpireTime
    const hash = this.createHmacHash(sessionId, expiresAt)
    return `${sessionId}.${expiresAt}.${hash}`
  }

  private createHmacHash(sessionId: string, expiresAt: number): string {
    const secret = this.configService.get<string>("CSRF_SECRET") as string
    const key = `${sessionId}.${expiresAt}`
    const hmac = createHmac("sha256", secret)
    hmac.update(key)
    return hmac.digest("base64")
  }

  private getCookieExpireTime(): number {
    const cookieExpireTime =
      this.configService.get<number>("COOKIE_EXPIRE_TIME")
    return cookieExpireTime ?? 38000
  }
}
