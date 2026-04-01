import { BaseTest } from "../../../../../helpers/base-test"
import { BuildRefreshTokenService } from "../../refresh-token/buildRefreshToken.service"
import { JwtService } from "@nestjs/jwt"
import { ConfigService } from "@nestjs/config"
import { RefreshToken } from "../../../entities/refreshToken"
import { Type } from "@nestjs/common"

class TestContext extends BaseTest {}

describe("BuildRefreshTokenService", () => {
  const ctx = new TestContext()

  let service: BuildRefreshTokenService
  let jwtMock: jest.Mocked<JwtService>
  let configMock: jest.Mocked<ConfigService>
  let signAsyncMock: jest.Mock
  let getConfigMock: jest.Mock
  let getOrThrowConfigMock: jest.Mock
  const buildRefreshTokenFixture = (
    id: string,
    tokenVersion: number
  ): RefreshToken => {
    const refreshToken = new RefreshToken()
    refreshToken.id = id
    refreshToken.tokenVersion = tokenVersion
    return refreshToken
  }

  beforeAll(async () => {
    await ctx.init()
  })

  beforeEach(async () => {
    await ctx.startTransaction()

    signAsyncMock = jest.fn()
    getConfigMock = jest.fn()
    getOrThrowConfigMock = jest.fn()

    jwtMock = {
      signAsync: signAsyncMock,
    } as unknown as jest.Mocked<JwtService>

    configMock = {
      get: getConfigMock,
      getOrThrow: getOrThrowConfigMock,
    } as unknown as jest.Mocked<ConfigService>

    service = ctx.createService(
      BuildRefreshTokenService,
      [],
      new Map<Type<unknown>, unknown>([
        [JwtService, jwtMock],
        [ConfigService, configMock],
      ])
    )
  })

  it("builds refresh token with configured expiry and expected payload", async () => {
    signAsyncMock.mockResolvedValue("signed-refresh-token")
    getConfigMock.mockReturnValue(120)
    getOrThrowConfigMock.mockReturnValue("refresh-secret")

    const refreshToken = buildRefreshTokenFixture("rt-1", 3)

    const result = await service.execute(refreshToken)

    expect(signAsyncMock).toHaveBeenCalledWith(
      {
        sub: "rt-1",
        v: 3,
      },
      {
        secret: "refresh-secret",
        expiresIn: "120s",
      }
    )
    expect(getConfigMock).toHaveBeenCalledWith("JWT_REFRESH_TOKEN_EXPIRE_TIME")
    expect(getOrThrowConfigMock).toHaveBeenCalledWith("JWT_REFRESH_SECRET")
    expect(result).toBe("signed-refresh-token")
  })

  it("falls back to default expiry when config is missing", async () => {
    signAsyncMock.mockResolvedValue("signed-refresh-token")
    getConfigMock.mockReturnValue(undefined)
    getOrThrowConfigMock.mockReturnValue("refresh-secret")

    const refreshToken = buildRefreshTokenFixture("rt-2", 1)

    await service.execute(refreshToken)

    expect(signAsyncMock).toHaveBeenCalledWith(
      {
        sub: "rt-2",
        v: 1,
      },
      {
        secret: "refresh-secret",
        expiresIn: "604800s",
      }
    )
  })

  afterEach(async () => {
    await ctx.rollback()
  })

  afterAll(async () => {
    await ctx.close()
  })
})
