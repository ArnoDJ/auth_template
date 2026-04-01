import { UnauthorizedException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { createHmac } from "crypto"
import { BaseTest } from "../../../../../helpers/base-test"
import { VerifyCsrfTokenService } from "../../csrf/verifyCsrfToken.service"

class TestContext extends BaseTest {}

describe("VerifyCsrfTokenService", () => {
  const ctx = new TestContext()

  let service: VerifyCsrfTokenService
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
      VerifyCsrfTokenService,
      [],
      new Map([[ConfigService, configMock]])
    )
  })

  afterEach(async () => {
    await ctx.rollback()
  })

  afterAll(async () => {
    await ctx.close()
  })

  it("returns true for a valid csrf token", () => {
    getConfigMock.mockReturnValue("csrf-secret")
    const expiresAt = Math.floor(Date.now() / 1000) + 120
    const hash = createHmac("sha256", "csrf-secret")
      .update(`session-id.${expiresAt}`)
      .digest("base64")

    const isValid = service.execute(`session-id.${expiresAt}.${hash}`)

    expect(isValid).toBe(true)
    expect(getConfigMock).toHaveBeenCalledWith("CSRF_SECRET")
  })

  it("throws when token format is invalid", () => {
    expect(() => service.execute("invalid")).toThrow(UnauthorizedException)
  })

  it("throws when token is expired", () => {
    const expiresAt = Math.floor(Date.now() / 1000) - 1

    expect(() => {
      service.execute(`session-id.${expiresAt}.hash`)
    }).toThrow(UnauthorizedException)
  })

  it("returns false when token hash does not match", () => {
    getConfigMock.mockReturnValue("csrf-secret")
    const expiresAt = Math.floor(Date.now() / 1000) + 120

    const isValid = service.execute(`session-id.${expiresAt}.wrong-hash`)

    expect(isValid).toBe(false)
    expect(getConfigMock).toHaveBeenCalledWith("CSRF_SECRET")
  })
})
