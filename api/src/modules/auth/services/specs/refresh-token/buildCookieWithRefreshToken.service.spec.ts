import { BaseTest } from "../../../../../helpers/base-test"
import { BuildCookieWithRefreshTokenService } from "../../refresh-token/buildCookieWithRefreshToken.service"
import { ConfigService } from "@nestjs/config"

class TestContext extends BaseTest {}

describe("BuildCookieWithRefreshTokenService", () => {
  const ctx = new TestContext()

  let service: BuildCookieWithRefreshTokenService
  let configMock: jest.Mocked<ConfigService>

  beforeAll(async () => {
    await ctx.init()
  })

  beforeEach(async () => {
    await ctx.startTransaction()
    configMock = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>

    service = ctx.createService(
      BuildCookieWithRefreshTokenService,
      [],
      new Map([
        [ConfigService, configMock],
      ])
    )
  })

  it("builds cookie with configured expire time", () => {
    configMock.get.mockImplementation((key: string) => {
      if (key === "COOKIE_EXPIRE_TIME") {
        return "9999"
      }

      if (key === "NODE_ENV") {
        return "production"
      }

      return undefined
    })

    const result = service.execute("refresh-token")
    expect(result).toBe(
      "refreshToken=refresh-token; HttpOnly; Secure; Path=/auth/refresh_token; SameSite=None; Max-Age=9999"
    )
  })

  it("falls back to default expire time when config is missing", () => {
    configMock.get.mockImplementation((key: string) => {
      if (key === "NODE_ENV") {
        return "production"
      }

      return undefined
    })

    const result = service.execute("refresh-token")
    expect(result).toBe(
      "refreshToken=refresh-token; HttpOnly; Secure; Path=/auth/refresh_token; SameSite=None; Max-Age=3800"
    )
  })

  it("builds localhost-safe cookie attributes in development", () => {
    configMock.get.mockImplementation((key: string) => {
      if (key === "COOKIE_EXPIRE_TIME") {
        return "9999"
      }

      if (key === "NODE_ENV") {
        return "development"
      }

      return undefined
    })

    const result = service.execute("refresh-token")

    expect(result).toBe(
      "refreshToken=refresh-token; HttpOnly; SameSite=Lax; Path=/auth/refresh_token; Max-Age=9999"
    )
  })

  it("calls config with correct key", () => {
    configMock.get.mockImplementation((key: string) => {
      if (key === "COOKIE_EXPIRE_TIME") {
        return "123"
      }

      if (key === "NODE_ENV") {
        return "production"
      }

      return undefined
    })

    service.execute("refresh-token")
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(configMock.get).toHaveBeenCalledWith("COOKIE_EXPIRE_TIME")
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(configMock.get).toHaveBeenCalledWith("NODE_ENV")
  })

  afterEach(async () => {
    await ctx.rollback()
  })

  afterAll(async () => {
    await ctx.close()
  })
})
