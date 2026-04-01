import { Inject, Injectable, UnauthorizedException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { JwtService } from "@nestjs/jwt"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { GetUserByIdService } from "../../../users/services/users/getUserById.service"
import { RefreshToken } from "../../entities/refreshToken"
import { RefreshTokenResult } from "../../types/refreshTokenResult"
import { BuildAccessTokenService } from "../authentication/buildAccessToken.service"
import { BuildCookieWithRefreshTokenService } from "./buildCookieWithRefreshToken.service"
import { BuildRefreshTokenService } from "./buildRefreshToken.service"

type RefreshTokenPayload = {
  sub?: string
  v?: number
}

@Injectable()
export class RefreshTokenService {
  constructor(
    @Inject(JwtService)
    private readonly jwtService: JwtService,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
    @Inject(GetUserByIdService)
    private readonly getUserByIdService: GetUserByIdService,
    @Inject(BuildAccessTokenService)
    private readonly buildAccessTokenService: BuildAccessTokenService,
    @Inject(BuildRefreshTokenService)
    private readonly buildRefreshTokenService: BuildRefreshTokenService,
    @Inject(BuildCookieWithRefreshTokenService)
    private readonly buildCookieWithRefreshTokenService: BuildCookieWithRefreshTokenService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>
  ) {}

  public async execute(
    refreshToken: string,
    userAgent: string
  ): Promise<RefreshTokenResult> {
    const refreshTokenPayload = await this.retrieveRefreshTokenPayload(refreshToken)
    const refreshTokenState = await this.getRefreshTokenState(refreshTokenPayload.sub)
    this.validateRefreshTokenState(
      refreshTokenState,
      userAgent,
      refreshTokenPayload.v
    )

    const newRefreshTokenState = await this.replaceRefreshTokenState(
      refreshTokenState,
      userAgent
    )
    const newRefreshToken = await this.buildRefreshTokenService.execute(
      newRefreshTokenState
    )
    const accessToken = await this.buildAccessToken(refreshTokenState.userId)
    const cookie = this.buildRefreshTokenCookie(newRefreshToken)

    return { accessToken, cookie }
  }

  private async retrieveRefreshTokenPayload(
    refreshToken: string
  ): Promise<{ sub: string; v: number }> {
    try {
      const refreshTokenSecret = this.configService.getOrThrow<string>(
        "JWT_REFRESH_SECRET"
      )
      const payload: unknown = await this.jwtService.verifyAsync(
        refreshToken,
        { secret: refreshTokenSecret }
      )
      if (!this.isRefreshTokenPayload(payload)) {
        throw new UnauthorizedException("not allowed")
      }

      return payload
    } catch (error) {
      throw new UnauthorizedException(error)
    }
  }

  private isRefreshTokenPayload(
    payload: unknown
  ): payload is { sub: string; v: number } {
    if (typeof payload !== "object" || payload === null) {
      return false
    }

    const candidate = payload as RefreshTokenPayload
    return typeof candidate.sub === "string" && typeof candidate.v === "number"
  }

  private async getRefreshTokenState(id: string): Promise<RefreshToken> {
    const refreshTokenState = await this.refreshTokenRepository.findOne({
      where: { id }
    })
    if (!refreshTokenState) {
      throw new UnauthorizedException("not allowed")
    }
    return refreshTokenState
  }

  private validateRefreshTokenState(
    refreshTokenState: RefreshToken,
    userAgent: string,
    tokenVersion: number
  ): void {
    if (refreshTokenState.revoked) {
      throw new UnauthorizedException("not allowed")
    }

    if (refreshTokenState.userAgent !== userAgent) {
      throw new UnauthorizedException("not allowed")
    }

    if (refreshTokenState.tokenVersion !== tokenVersion) {
      throw new UnauthorizedException("not allowed")
    }
  }

  private async replaceRefreshTokenState(
    refreshTokenState: RefreshToken,
    userAgent: string
  ): Promise<RefreshToken> {
    const currentTokenVersion = refreshTokenState.tokenVersion
    const updateResult = await this.refreshTokenRepository.update(
      {
        id: refreshTokenState.id,
        tokenVersion: currentTokenVersion,
        userAgent,
        revoked: false
      },
      {
        tokenVersion: currentTokenVersion + 1,
        updatedAt: new Date()
      }
    )
    if (updateResult.affected !== 1) {
      throw new UnauthorizedException("not allowed")
    }

    const updatedTokenState = await this.refreshTokenRepository.findOne({
      where: { id: refreshTokenState.id }
    })
    if (!updatedTokenState) {
      throw new UnauthorizedException("not allowed")
    }

    return updatedTokenState
  }

  private async buildAccessToken(userId: string): Promise<string> {
    const user = await this.getUserByIdService.execute(userId)
    return await this.buildAccessTokenService.execute(user)
  }

  private buildRefreshTokenCookie(refreshToken: string): string {
    return this.buildCookieWithRefreshTokenService.execute(refreshToken)
  }
}
