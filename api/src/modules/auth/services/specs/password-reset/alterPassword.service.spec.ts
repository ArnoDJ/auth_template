import { BaseTest } from "../../../../../helpers/base-test"
import { AlterPasswordService } from "../../password-reset/alterPassword.service"
import { PasswordResetToken } from "../../../entities/passwordResetToken"
import { BadRequestException, NotFoundException } from "@nestjs/common"
import { Repository } from "typeorm"
import { createHash } from "crypto"
import { User } from "../../../entities/user"
import { RevokeAllRefreshTokensForUserService } from "../../refresh-token/revokeAllRefreshTokensForUser.service"
import { userMock } from "../../../../../mocks/user.mock"

class TestContext extends BaseTest {}

describe("AlterPasswordService", () => {
  const ctx = new TestContext()
  let service: AlterPasswordService
  let repos: {
    user: Repository<User>
    token: Repository<PasswordResetToken>
  }
  let revokeServiceMock: {
    execute: jest.Mock
  }

  beforeAll(async () => {
    await ctx.init()
  })

  beforeEach(async () => {
    await ctx.startTransaction()
    repos = ctx.setupRepos({
      user: User,
      token: PasswordResetToken,
    })
    revokeServiceMock = {
      execute: jest.fn().mockResolvedValue(undefined),
    }
    service = ctx.createService(
      AlterPasswordService,
      [repos.token, repos.user],
      new Map([
        [RevokeAllRefreshTokensForUserService, revokeServiceMock],
      ])
    )
  })

  const buildToken = (raw: string): string =>
    createHash("sha256").update(raw).digest("hex")

  it("throws when passwords do not match", async () => {
    await expect(
      service.execute(
        { password: "a", passwordConfirmation: "b" },
        "token"
      )
    ).rejects.toThrow(BadRequestException)
  })

  it("throws when token does not exist", async () => {
    await expect(
      service.execute(
        { password: "a", passwordConfirmation: "a" },
        "invalid"
      )
    ).rejects.toThrow(BadRequestException)
  })

  it("throws when token is expired", async () => {
    const user = await repos.user.save({ ...userMock, email: "test@test.com" })

    await repos.token.save({
      userId: user.id,
      token: buildToken("valid"),
      validUntil: new Date(Date.now() - 1000),
    })

    await expect(
      service.execute(
        { password: "a", passwordConfirmation: "a" },
        "valid"
      )
    ).rejects.toThrow(BadRequestException)
  })

  it("successfully changes password and revokes tokens", async () => {
    const user = await repos.user.save({
      ...userMock,
      email: "test@test.com",
      password: "old",
      failedLoginAttempts: 5,
      lockedUntil: new Date(),
    })

    await repos.token.save({
      userId: user.id,
      token: buildToken("valid"),
      validUntil: new Date(Date.now() + 60_000),
    })

    await service.execute(
      {
        password: "new-password",
        passwordConfirmation: "new-password",
      },
      "valid"
    )

    const updated = await repos.user.findOneByOrFail({ id: user.id })

    expect(updated.password).not.toBe("old")
    expect(updated.failedLoginAttempts).toBe(0)
    expect(updated.lockedUntil).toBeNull()
    expect(revokeServiceMock.execute).toHaveBeenCalledWith(user.id)
    const tokens = await repos.token.find({ where: { userId: user.id } })
    expect(tokens.length).toBe(0)
  })

  afterEach(async () => {
    await ctx.rollback()
  })

  afterAll(async () => {
    await ctx.close()
  })
})
