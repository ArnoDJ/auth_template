import {
  buildMailerSendModuleMock,
  getMailerSendMocks
} from "../../../../../factories/mailerSendMock.factory"
import { createHash, randomUUID } from "crypto"
import { Type } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { Repository } from "typeorm"
import { BaseTest } from "../../../../../helpers/base-test"
import { userMock } from "../../../../../mocks/user.mock"
import { User } from "../../../entities/user"
import { PasswordResetToken } from "../../../entities/passwordResetToken"
import { PasswordResetService } from "../../password-reset/passwordReset.service"
import { GetUserByEmailService } from "../../../../users/services/users/getUserByEmail.service"

jest.mock("mailgun.js", () => buildMailerSendModuleMock())
jest.mock("form-data", () => jest.fn())

class TestContext extends BaseTest {}

describe("PasswordResetService", () => {
  const ctx = new TestContext()

  let service: PasswordResetService
  let repos: {
    user: Repository<User>
    token: Repository<PasswordResetToken>
  }
  let configMock: jest.Mocked<ConfigService>
  let getConfigMock: jest.Mock
  const waitFor = async (
    condition: () => Promise<boolean> | boolean
  ): Promise<void> => {
    const timeoutAt = Date.now() + 1_000
    while (Date.now() < timeoutAt) {
      if (await condition()) {
        return
      }
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 10)
      })
    }

    throw new Error("timed out waiting for async password reset work")
  }

  beforeAll(async () => {
    await ctx.init()
  })

  beforeEach(async () => {
    getMailerSendMocks().reset()

    await ctx.startTransaction()

    repos = ctx.setupRepos({
      user: User,
      token: PasswordResetToken,
    })

    getConfigMock = jest.fn()
    configMock = {
      get: getConfigMock,
    } as unknown as jest.Mocked<ConfigService>

    const getUserByEmailService = ctx.createService(GetUserByEmailService, [
      repos.user,
    ])

    service = ctx.createService(
      PasswordResetService,
      [repos.token],
      new Map<Type<unknown>, unknown>([
        [GetUserByEmailService, getUserByEmailService],
        [ConfigService, configMock],
      ])
    )
  })

  it("creates a hashed reset token and sends email using configured sender", async () => {
    const user = await repos.user.save({
      ...userMock,
      id: randomUUID(),
      email: `user-${randomUUID()}@test.com`,
    })

    getConfigMock.mockImplementation((key: string) => {
      if (key === "FRONTEND_BASE_URL") {
        return "https://example.com/"
      }

      if (key === "MAILGUN_API_KEY") {
        return "api-key"
      }

      if (key === "MAILGUN_FROM_EMAIL") {
        return "sender@example.com"
      }

      if (key === "MAILGUN_FROM_NAME") {
        return "Auth Template"
      }

      if (key === "MAILGUN_DOMAIN") {
        return "sandbox.example.mailgun.org"
      }

      return undefined
    })

    await service.execute(user.email)
    await waitFor(async () => {
      return await repos.token.count({ where: { userId: user.id } }) === 1
    })

    const savedToken = await repos.token.findOneByOrFail({ userId: user.id })
    const mailerSendMocks = getMailerSendMocks()

    expect(savedToken.token).toHaveLength(64)
    expect(savedToken.validUntil).toBeInstanceOf(Date)
    expect(mailerSendMocks.mockMailerSend).toHaveBeenCalledWith({
      username: "api",
      key: "api-key",
      url: undefined
    })
    expect(mailerSendMocks.mockSend).toHaveBeenCalledTimes(1)

    const emailParams = mailerSendMocks.mockSend.mock.calls[0][0]
    if (typeof emailParams.text !== "string") {
      throw new Error("expected email text")
    }

    expect(emailParams.text).toContain("https://example.com/password-reset/")

    const resetUrl = emailParams.text.replace(
      "Reset your password using this link: ",
      ""
    )
    const rawToken = resetUrl.split("/password-reset/")[1]
    if (!rawToken) {
      throw new Error("expected raw token in reset url")
    }

    expect(savedToken.token).toBe(
      createHash("sha256").update(rawToken).digest("hex")
    )
  })

  it("returns without creating token or sending mail for unknown user", async () => {
    getConfigMock.mockReturnValue(undefined)

    await service.execute("missing-user@test.com")

    const tokens = await repos.token.find()
    const mailerSendMocks = getMailerSendMocks()

    expect(tokens).toHaveLength(0)
    expect(mailerSendMocks.mockSend).not.toHaveBeenCalled()
  })

  it("replaces an existing token and falls back to APP_URL", async () => {
    const user = await repos.user.save({
      ...userMock,
      id: randomUUID(),
      email: `user-${randomUUID()}@test.com`,
    })

    const existingToken = await repos.token.save({
      userId: user.id,
      token: createHash("sha256").update("existing-token").digest("hex"),
      validUntil: new Date(Date.now() + 60_000),
    })

    getConfigMock.mockImplementation((key: string) => {
      if (key === "APP_URL") {
        return "https://fallback.example.com"
      }

      if (key === "MAILGUN_API_KEY") {
        return "api-key"
      }

      if (key === "MAILGUN_FROM_EMAIL") {
        return "sender@example.com"
      }

      if (key === "MAILGUN_FROM_NAME") {
        return "Auth Template"
      }

      if (key === "MAILGUN_DOMAIN") {
        return "sandbox.example.mailgun.org"
      }

      return undefined
    })

    await service.execute(user.email)
    await waitFor(async () => {
      return await repos.token.count({ where: { userId: user.id } }) === 1
    })

    const savedToken = await repos.token.findOneByOrFail({ userId: user.id })
    const mailerSendMocks = getMailerSendMocks()

    expect(savedToken.id).not.toBe(existingToken.id)
    expect(savedToken.token).toHaveLength(64)

    const emailParams = mailerSendMocks.mockSend.mock.calls[0][0]
    if (typeof emailParams.text !== "string") {
      throw new Error("expected email text")
    }

    expect(emailParams.text).toContain(
      "https://fallback.example.com/password-reset/"
    )
  })

  afterEach(async () => {
    await ctx.rollback()
  })

  afterAll(async () => {
    await ctx.close()
  })
})
