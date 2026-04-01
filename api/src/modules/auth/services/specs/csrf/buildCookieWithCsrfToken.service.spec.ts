import { BaseTest } from "../../../../../helpers/base-test"
import { BuildCookieWithCsrfTokenService } from "../../csrf/buildCookieWithCsrfToken.service"
import { ConfigService } from "@nestjs/config"

class TestContext extends BaseTest {}

describe("BuildCookieWithCsrfTokenService", () => {
  const ctx = new TestContext()

  let service: BuildCookieWithCsrfTokenService
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
      BuildCookieWithCsrfTokenService,
      [],
      new Map([
        [ConfigService, configMock],
      ])
    )
  })

  it("builds cookie with configured expire time", () => {
    configMock.get.mockImplementation((key: string) => {
      if (key === "COOKIE_EXPIRE_TIME") {
        return 12345
      }

      if (key === "NODE_ENV") {
        return "production"
      }

      return undefined
    })

    const result = service.execute("csrf-token")

    expect(result).toBe(
      "_csrf=csrf-token; Secure; Path=/; SameSite=None; Max-Age=12345"
    )
  })

  it("falls back to default expire time when config is missing", () => {
    configMock.get.mockImplementation((key: string) => {
      if (key === "NODE_ENV") {
        return "production"
      }

      return undefined
    })

    const result = service.execute("csrf-token")

    expect(result).toBe(
      "_csrf=csrf-token; Secure; Path=/; SameSite=None; Max-Age=38000"
    )
  })

  it("builds localhost-safe cookie attributes in development", () => {
    configMock.get.mockImplementation((key: string) => {
      if (key === "COOKIE_EXPIRE_TIME") {
        return 12345
      }

      if (key === "NODE_ENV") {
        return "development"
      }

      return undefined
    })

    const result = service.execute("csrf-token")

    expect(result).toBe(
      "_csrf=csrf-token; SameSite=Lax; Path=/; Max-Age=12345"
    )
  })

  afterEach(async () => {
    await ctx.rollback()
  })

  afterAll(async () => {
    await ctx.close()
  })
})
