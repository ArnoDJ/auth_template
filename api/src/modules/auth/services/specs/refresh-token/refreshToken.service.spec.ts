import { randomUUID } from "crypto"
import { UnauthorizedException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { JwtService } from "@nestjs/jwt"
import { Repository, UpdateResult } from "typeorm"
import { BaseTest } from "../../../../../helpers/base-test"
import { userMock } from "../../../../../mocks/user.mock"
import { User } from "../../../entities/user"
import { RefreshToken } from "../../../entities/refreshToken"
import { RefreshTokenService } from "../../refresh-token/refreshToken.service"
import { GetUserByIdService } from "../../../../users/services/users/getUserById.service"
import { BuildAccessTokenService } from "../../authentication/buildAccessToken.service"
import { BuildRefreshTokenService } from "../../refresh-token/buildRefreshToken.service"
import { BuildCookieWithRefreshTokenService } from "../../refresh-token/buildCookieWithRefreshToken.service"

class TestContext extends BaseTest {}

describe("RefreshTokenService", () => {
  const ctx = new TestContext()

  let service: RefreshTokenService
  let repos: {
    user: Repository<User>
    refreshToken: Repository<RefreshToken>
  }
  let jwtService: JwtService
  let buildAccessTokenService: BuildAccessTokenService
  let buildRefreshTokenService: BuildRefreshTokenService
  let buildCookieWithRefreshTokenService: BuildCookieWithRefreshTokenService
  let configMock: jest.Mocked<ConfigService>
  let getConfigMock: jest.Mock
  let getOrThrowConfigMock: jest.Mock

  beforeAll(async () => {
    await ctx.init()
  })

  beforeEach(async () => {
    await ctx.startTransaction()
    repos = ctx.setupRepos({
      user: User,
      refreshToken: RefreshToken,
    })
    jwtService = new JwtService({ secret: "access-secret" })
    getConfigMock = jest.fn((key: string) => {
      if (key === "JWT_REFRESH_TOKEN_EXPIRE_TIME") {
        return 604800
      }

      if (key === "COOKIE_EXPIRE_TIME") {
        return 3800
      }

      return undefined
    })
    getOrThrowConfigMock = jest.fn((key: string) => {
      if (key === "JWT_REFRESH_SECRET") {
        return "refresh-secret"
      }

      throw new Error(`missing config key: ${key}`)
    })

    configMock = {
      get: getConfigMock,
      getOrThrow: getOrThrowConfigMock
    } as unknown as jest.Mocked<ConfigService>

    const getUserByIdService = new GetUserByIdService(repos.user)
    buildAccessTokenService = new BuildAccessTokenService(
      jwtService
    )
    buildRefreshTokenService = new BuildRefreshTokenService(
      jwtService,
      configMock
    )
    buildCookieWithRefreshTokenService =
      new BuildCookieWithRefreshTokenService(configMock)

    service = new RefreshTokenService(
      jwtService,
      configMock,
      getUserByIdService,
      buildAccessTokenService,
      buildRefreshTokenService,
      buildCookieWithRefreshTokenService,
      repos.refreshToken
    )
  })

  it("refreshes token, rotates version and returns access token plus cookie", async () => {
    const user = await repos.user.save({
      ...userMock,
      id: randomUUID(),
      email: `user-${randomUUID()}@test.com`,
      admin: false
    })
    const refreshTokenState = await repos.refreshToken.save({
      userId: user.id,
      userAgent: "agent-1",
      revoked: false,
      tokenVersion: 2
    })
    const buildAccessTokenSpy = jest
      .spyOn(buildAccessTokenService, "execute")
      .mockResolvedValue("access-token")
    const buildRefreshTokenSpy = jest
      .spyOn(buildRefreshTokenService, "execute")
      .mockResolvedValue("next-refresh-token")
    const buildCookieSpy = jest
      .spyOn(buildCookieWithRefreshTokenService, "execute")
      .mockReturnValue("refreshToken=next-refresh-token; Max-Age=3800")

    await expect(
      service.execute(
        await jwtService.signAsync(
          { sub: refreshTokenState.id, v: refreshTokenState.tokenVersion },
          {
            secret: "refresh-secret",
            expiresIn: "604800s"
          }
        ),
        "agent-1"
      )
    ).resolves.toEqual({
      accessToken: "access-token",
      cookie: "refreshToken=next-refresh-token; Max-Age=3800"
    })

    const updatedState = await repos.refreshToken.findOneByOrFail({
      id: refreshTokenState.id
    })

    expect(updatedState.tokenVersion).toBe(3)
    expect(updatedState.revoked).toBe(false)
    expect(buildAccessTokenSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: user.id,
        admin: false
      })
    )
    expect(buildRefreshTokenSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: refreshTokenState.id,
        tokenVersion: 3
      })
    )
    expect(buildCookieSpy).toHaveBeenCalledWith("next-refresh-token")
  })

  it("throws when payload is missing required claims", async () => {
    const tokenMissingVersion = await jwtService.signAsync(
      { sub: "rt-1" },
      { secret: "refresh-secret" }
    )

    await expect(service.execute(tokenMissingVersion, "agent")).rejects.toThrow(
      UnauthorizedException
    )
  })

  it("throws when refresh token state is missing", async () => {
    const token = await jwtService.signAsync(
      { sub: randomUUID(), v: 1 },
      { secret: "refresh-secret" }
    )

    await expect(service.execute(token, "agent-1")).rejects.toThrow(
      UnauthorizedException
    )
  })

  it("throws when refresh token state is revoked", async () => {
    const user = await repos.user.save({
      ...userMock,
      id: randomUUID(),
      email: `user-${randomUUID()}@test.com`
    })
    const refreshTokenState = await repos.refreshToken.save({
      userId: user.id,
      userAgent: "agent-1",
      revoked: true,
      tokenVersion: 1
    })
    const token = await jwtService.signAsync(
      { sub: refreshTokenState.id, v: 1 },
      { secret: "refresh-secret" }
    )

    await expect(service.execute(token, "agent-1")).rejects.toThrow(
      UnauthorizedException
    )
  })

  it("throws when refresh token state user agent does not match", async () => {
    const user = await repos.user.save({
      ...userMock,
      id: randomUUID(),
      email: `user-${randomUUID()}@test.com`
    })
    const refreshTokenState = await repos.refreshToken.save({
      userId: user.id,
      userAgent: "agent-1",
      revoked: false,
      tokenVersion: 1
    })
    const token = await jwtService.signAsync(
      { sub: refreshTokenState.id, v: 1 },
      { secret: "refresh-secret" }
    )

    await expect(service.execute(token, "agent-2")).rejects.toThrow(
      UnauthorizedException
    )
  })

  it("throws when refresh token version does not match payload", async () => {
    const user = await repos.user.save({
      ...userMock,
      id: randomUUID(),
      email: `user-${randomUUID()}@test.com`
    })
    const refreshTokenState = await repos.refreshToken.save({
      userId: user.id,
      userAgent: "agent-1",
      revoked: false,
      tokenVersion: 1
    })
    const token = await jwtService.signAsync(
      { sub: refreshTokenState.id, v: 2 },
      { secret: "refresh-secret" }
    )

    await expect(service.execute(token, "agent-1")).rejects.toThrow(
      UnauthorizedException
    )
  })

  it("throws when concurrent rotation update fails", async () => {
    const user = await repos.user.save({
      ...userMock,
      id: randomUUID(),
      email: `user-${randomUUID()}@test.com`
    })
    const refreshTokenState = await repos.refreshToken.save({
      userId: user.id,
      userAgent: "agent-1",
      revoked: false,
      tokenVersion: 1
    })
    const token = await jwtService.signAsync(
      { sub: refreshTokenState.id, v: 1 },
      { secret: "refresh-secret" }
    )

    jest.spyOn(repos.refreshToken, "update").mockResolvedValue({
      affected: 0,
      raw: [],
      generatedMaps: []
    } as UpdateResult)

    await expect(service.execute(token, "agent-1")).rejects.toThrow(
      UnauthorizedException
    )
  })

  afterEach(async () => {
    await ctx.rollback()
  })

  afterAll(async () => {
    await ctx.close()
  })
})
