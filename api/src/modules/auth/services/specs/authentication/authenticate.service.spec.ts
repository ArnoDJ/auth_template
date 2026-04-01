import { BaseTest } from "../../../../../helpers/base-test"
import { AuthenticateService } from "../../authentication/authenticate.service"
import { User } from "../../../entities/user"
import { Repository } from "typeorm"
import { Type, UnauthorizedException } from "@nestjs/common"
import { hash } from "bcrypt"
import { userMock } from "../../../../../mocks/user.mock"
import { GetUserByEmailService } from "../../../../../modules/users/services/users/getUserByEmail.service"
import { AccountLockoutService } from "../../authentication/accountLockout.service"

class TestContext extends BaseTest {}

describe("AuthenticateService", () => {
  const ctx = new TestContext()
  let service: AuthenticateService
  let repos: {
    user: Repository<User>
  }

  beforeAll(async () => {
    await ctx.init()
  })

  beforeEach(async () => {
  await ctx.startTransaction()

  repos = ctx.setupRepos({
    user: User,
  })

  const getUserByEmailService = ctx.createService(GetUserByEmailService, [
    repos.user,
  ])

  const accountLockoutService = ctx.createService(AccountLockoutService, [
    repos.user,
  ])

  service = ctx.createService(
  AuthenticateService,
  [],
  new Map<Type<unknown>, unknown>([
    [GetUserByEmailService, getUserByEmailService],
    [AccountLockoutService, accountLockoutService],
  ])
)
})

  it("returns user dto on successful login", async () => {
    const user = await repos.user.save({
      ...userMock,
      password: await hash("correct-password", 10),
      isActive: true,
      failedLoginAttempts: 2,
    })
    const result = await service.execute({
      email: user.email,
      password: "correct-password",
    })
    const updated = await repos.user.findOneByOrFail({ id: user.id })

    expect(updated.failedLoginAttempts).toBe(0)

    expect(result).toMatchObject({
      id: user.id,
      email: user.email,
    })
  })

  it("throws when user does not exist", async () => {
    await expect(
      service.execute({
        email: "notfound@test.com",
        password: "whatever",
      })
    ).rejects.toThrow(UnauthorizedException)
  })

  it("throws when user is inactive", async () => {
    const user = await repos.user.save({
      ...userMock,
      email: "test@test.com",
      password: await hash("correct-password", 10),
      isActive: false,
    })
    await expect(
      service.execute({
        email: user.email,
        password: "correct-password",
      })
    ).rejects.toThrow(UnauthorizedException)
  })

  it("calls lockout FAILURE on wrong password", async () => {
    const user = await repos.user.save({
      ...userMock,
      email: "test@test.com",
      password: await hash("correct-password", 10),
      isActive: true,
      failedLoginAttempts: 0,
    })
    await expect(
      service.execute({
        email: user.email,
        password: "wrong-password",
      })
    ).rejects.toThrow(UnauthorizedException)
    const updated = await repos.user.findOneByOrFail({ id: user.id })

    expect(updated.failedLoginAttempts).toBe(1)
  })

  afterEach(async () => {
    await ctx.rollback()
  })

  afterAll(async () => {
    await ctx.close()
  })
})
