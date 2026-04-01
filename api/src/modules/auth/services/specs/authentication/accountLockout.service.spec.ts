import { BaseTest } from "../../../../../helpers/base-test"
import { User } from "../../../entities/user"
import { LoginAttemptResultEnum } from "../../../enums/loginAttemptResult.enum"
import { AccountLockoutService } from "../../authentication/accountLockout.service"
import { UnauthorizedException } from "@nestjs/common"
import { Repository } from "typeorm"
import { userMock } from "../../../../../mocks/user.mock"

class TestContext extends BaseTest {}

describe("AccountLockoutService", () => {
  const ctx = new TestContext()

  let service: AccountLockoutService
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

    service = ctx.createService(AccountLockoutService, [repos.user])
  })

  it("throws when user is already locked", async () => {
    const user = await repos.user.save({
      ...userMock,
      failedLoginAttempts: 5,
      lockedUntil: new Date(Date.now() + 60_000),
    })

    await expect(
      service.execute(user, LoginAttemptResultEnum.FAILURE)
    ).rejects.toThrow(UnauthorizedException)
  })

  it("increments failed attempts without locking before threshold", async () => {
    const user = await repos.user.save({
      ...userMock,
      failedLoginAttempts: 2,
      lockedUntil: null,
    })

    await service.execute(user, LoginAttemptResultEnum.FAILURE)

    const updated = await repos.user.findOneByOrFail({ id: user.id })
    expect(updated.failedLoginAttempts).toBe(3)
    expect(updated.lockedUntil).toBeNull()
  })

  it("locks user when threshold is reached", async () => {
    const user = await repos.user.save({
      ...userMock,
      failedLoginAttempts: 4,
      lockedUntil: null,
    })

    await service.execute(user, LoginAttemptResultEnum.FAILURE)

    const updated = await repos.user.findOneByOrFail({ id: user.id })
    expect(updated.failedLoginAttempts).toBe(5)
    expect(updated.lockedUntil).toBeInstanceOf(Date)
    expect(updated.lockedUntil!.getTime()).toBeGreaterThan(Date.now())
  })

  it("reduces failed attempts on success and clears lock", async () => {
    const user = await repos.user.save({
      ...userMock,
      failedLoginAttempts: 5,
      lockedUntil: new Date(),
    })

    await service.execute(user, LoginAttemptResultEnum.SUCCESS)

    const updated = await repos.user.findOneByOrFail({ id: user.id })
    expect(updated.failedLoginAttempts).toBe(3)
    expect(updated.lockedUntil).toBeNull()
  })

  it("never reduces failed attempts below zero", async () => {
    const user = await repos.user.save({
      ...userMock,
      failedLoginAttempts: 1,
      lockedUntil: null,
    })

    await service.execute(user, LoginAttemptResultEnum.SUCCESS)

    const updated = await repos.user.findOneByOrFail({ id: user.id })
    expect(updated.failedLoginAttempts).toBe(0)
  })

  afterEach(async () => {
    await ctx.rollback()
  })

  afterAll(async () => {
    await ctx.close()
  })
})
