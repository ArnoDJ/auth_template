import { BaseTest } from "../../../../../helpers/base-test"
import { BuildCsrfTokenService } from "../../csrf/buildCsrfToken.service"
import { ConfigService } from "@nestjs/config"
import { createHmac } from "crypto"

class TestContext extends BaseTest {}

describe("BuildCsrfTokenService", () => {
  const ctx = new TestContext()

  let service: BuildCsrfTokenService
  let configMock: jest.Mocked<ConfigService>
  let getConfigMock: jest.Mock

  beforeAll(async () => {
    await ctx.init()
  })

  beforeEach(async () => {
    await ctx.startTransaction()

    getConfigMock = jest.fn()

    configMock = {
      get: getConfigMock,
    } as unknown as jest.Mocked<ConfigService>

    service = ctx.createService(
      BuildCsrfTokenService,
      [],
      new Map([
        [ConfigService, configMock],
      ])
    )
  })

  it("builds token with session id, expiry and valid hash", () => {
    getConfigMock.mockImplementation((key: string) => {
      if (key === "COOKIE_EXPIRE_TIME") {
        return 120
      }

      if (key === "CSRF_SECRET") {
        return "csrf-secret"
      }
      return undefined
    })

    const nowInSeconds = Math.floor(Date.now() / 1000)
    const token = service.execute()
    const [sessionId, expiresAtRaw, hash] = token.split(".")
    const expiresAt = Number(expiresAtRaw)

    const expectedHash = createHmac("sha256", "csrf-secret")
      .update(`${sessionId}.${expiresAt}`)
      .digest("base64")

    expect(sessionId).toHaveLength(128)
    expect(expiresAt).toBe(nowInSeconds + 120)
    expect(hash).toBe(expectedHash)
    expect(getConfigMock).toHaveBeenCalledWith("COOKIE_EXPIRE_TIME")
    expect(getConfigMock).toHaveBeenCalledWith("CSRF_SECRET")
  })

  it("falls back to default expiry when config is missing", () => {
    getConfigMock.mockImplementation((key: string) => {
      if (key === "CSRF_SECRET") {
        return "csrf-secret"
      }
      return undefined
    })

    const nowInSeconds = Math.floor(Date.now() / 1000)
    const token = service.execute()
    const [, expiresAtRaw] = token.split(".")

    expect(Number(expiresAtRaw)).toBe(nowInSeconds + 38000)
  })

  afterEach(async () => {
    await ctx.rollback()
  })

  afterAll(async () => {
    await ctx.close()
  })
})
