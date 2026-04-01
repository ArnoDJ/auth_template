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
import { EmailVerificationToken } from "../../../entities/emailVerificationToken"
import { SendEmailVerificationService } from "../../authentication/sendEmailVerification.service"
import { buildUserDto } from "../../../../../factories/userDto.factory"

jest.mock("mailgun.js", () => buildMailerSendModuleMock())
jest.mock("form-data", () => jest.fn())

class TestContext extends BaseTest {}

describe("SendEmailVerificationService", () => {
  const ctx = new TestContext()

  let service: SendEmailVerificationService
  let repos: {
    user: Repository<User>
    token: Repository<EmailVerificationToken>
  }
  let configMock: jest.Mocked<ConfigService>
  let getConfigMock: jest.Mock

  beforeAll(async () => {
    await ctx.init()
  })

  beforeEach(async () => {
    getMailerSendMocks().reset()
    await ctx.startTransaction()

    repos = ctx.setupRepos({
      user: User,
      token: EmailVerificationToken
    })

    getConfigMock = jest.fn()
    configMock = {
      get: getConfigMock
    } as unknown as jest.Mocked<ConfigService>

    service = ctx.createService(
      SendEmailVerificationService,
      [repos.token],
      new Map<Type<unknown>, unknown>([[ConfigService, configMock]])
    )
  })

  it("creates a hashed verification token and sends mail", async () => {
    const user = await repos.user.save({
      ...userMock,
      id: randomUUID(),
      email: `verify-${randomUUID()}@test.com`,
      admin: false,
      isActive: false
    })

    getConfigMock.mockImplementation((key: string) => {
      if (key === "FRONTEND_BASE_URL") {
        return "https://app.example.com/"
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

    await service.execute(buildUserDto(user))

    const savedToken = await repos.token.findOneByOrFail({ userId: user.id })
    const mailerSendMocks = getMailerSendMocks()

    expect(savedToken.token).toHaveLength(64)
    expect(mailerSendMocks.mockSend).toHaveBeenCalledTimes(1)

    const emailParams = mailerSendMocks.mockSend.mock.calls[0][0]
    if (typeof emailParams.text !== "string") {
      throw new Error("expected verification email text")
    }

    expect(emailParams.text).toContain("https://app.example.com/verify-email/")

    const verificationUrl = emailParams.text.replace(
      "Verify your email using this link: ",
      ""
    )
    const rawToken = verificationUrl.split("/verify-email/")[1]
    if (!rawToken) {
      throw new Error("expected raw token in verification url")
    }

    expect(savedToken.token).toBe(
      createHash("sha256").update(rawToken).digest("hex")
    )
  })

  it("replaces an existing verification token", async () => {
    const user = await repos.user.save({
      ...userMock,
      id: randomUUID(),
      email: `verify-${randomUUID()}@test.com`,
      admin: false,
      isActive: false
    })

    const existingToken = await repos.token.save({
      userId: user.id,
      token: createHash("sha256").update("existing-token").digest("hex"),
      validUntil: new Date(Date.now() + 60_000)
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

    await service.execute(buildUserDto(user))

    const savedToken = await repos.token.findOneByOrFail({ userId: user.id })
    expect(savedToken.id).not.toBe(existingToken.id)
  })

  afterEach(async () => {
    await ctx.rollback()
  })

  afterAll(async () => {
    await ctx.close()
  })
})
