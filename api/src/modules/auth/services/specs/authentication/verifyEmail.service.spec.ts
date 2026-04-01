import { BadRequestException } from "@nestjs/common"
import { createHash, randomUUID } from "crypto"
import { Repository } from "typeorm"
import { BaseTest } from "../../../../../helpers/base-test"
import { userMock } from "../../../../../mocks/user.mock"
import { EmailVerificationToken } from "../../../entities/emailVerificationToken"
import { User } from "../../../entities/user"
import { VerifyEmailService } from "../../authentication/verifyEmail.service"

class TestContext extends BaseTest {}

describe("VerifyEmailService", () => {
  const ctx = new TestContext()

  let service: VerifyEmailService
  let repos: {
    user: Repository<User>
    token: Repository<EmailVerificationToken>
  }

  beforeAll(async () => {
    await ctx.init()
  })

  beforeEach(async () => {
    await ctx.startTransaction()
    repos = ctx.setupRepos({
      user: User,
      token: EmailVerificationToken
    })
    service = new VerifyEmailService(repos.token, repos.user)
  })

  it("activates the user and deletes verification tokens", async () => {
    const rawToken = "verification-token"
    const user = await repos.user.save({
      ...userMock,
      id: randomUUID(),
      email: `verify-${randomUUID()}@test.com`,
      admin: false,
      isActive: false
    })

    await repos.token.save({
      userId: user.id,
      token: createHash("sha256").update(rawToken).digest("hex"),
      validUntil: new Date(Date.now() + 60_000)
    })

    await service.execute(rawToken)

    const savedUser = await repos.user.findOneByOrFail({ id: user.id })
    const savedTokens = await repos.token.findBy({ userId: user.id })

    expect(savedUser.isActive).toBe(true)
    expect(savedTokens).toHaveLength(0)
  })

  it("throws for a missing token", async () => {
    await expect(service.execute("missing-token")).rejects.toThrow(
      BadRequestException
    )
  })

  it("throws for an expired token", async () => {
    const rawToken = "expired-token"
    const user = await repos.user.save({
      ...userMock,
      id: randomUUID(),
      email: `verify-${randomUUID()}@test.com`,
      admin: false,
      isActive: false
    })

    await repos.token.save({
      userId: user.id,
      token: createHash("sha256").update(rawToken).digest("hex"),
      validUntil: new Date(Date.now() - 60_000)
    })

    await expect(service.execute(rawToken)).rejects.toThrow(
      BadRequestException
    )
  })

  afterEach(async () => {
    await ctx.rollback()
  })

  afterAll(async () => {
    await ctx.close()
  })
})
